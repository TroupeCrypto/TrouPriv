"""
Agent Core module for BiB! Lite Agent.
Handles LLM integration and decision-making logic.
"""

import json
from typing import Dict, List, Any
from openai import OpenAI


class AgentCore:
    """
    The "Brain" of the agent - uses LLM to determine next actions.
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the Agent Core with OpenAI API credentials.
        
        Args:
            api_key: OpenAI API key
        """
        self.client = OpenAI(api_key=api_key)
        self.system_prompt = self._create_system_prompt()
    
    def _create_system_prompt(self) -> str:
        """
        Create the system prompt that defines the agent's role and capabilities.
        
        Returns:
            str: The system prompt for the LLM
        """
        return """You are BiB! Lite, a helpful AI agent that can interact with a sandboxed file system and execute commands to help users accomplish their goals.

**YOUR ROLE:**
You operate in a "Think → Act → Observe" loop. You will receive a goal from the user, analyze the current state, and decide on ONE action to take next. After each action is executed, you will receive the observation (result) and then decide the next action.

**AVAILABLE TOOLS:**

1. **writeFile** - Write content to a file
   Parameters:
   - path: string (relative path from workspace root)
   - content: string (the content to write)

2. **readFile** - Read content from a file
   Parameters:
   - path: string (relative path from workspace root)

3. **listDirectory** - List contents of a directory
   Parameters:
   - path: string (relative path from workspace root, default ".")

4. **executeShellCommand** - Execute a shell command in the workspace
   Parameters:
   - command: string (the shell command to execute)

5. **task_complete** - Signal that the goal has been accomplished
   Parameters:
   - reason: string (explanation of what was accomplished)

**IMPORTANT RULES:**

1. You can ONLY use the tools listed above
2. Return ONLY ONE action at a time in valid JSON format
3. All file paths are relative to the workspace directory
4. Think step-by-step and break down complex tasks
5. After each action, you'll receive an observation - use it to plan your next step
6. When the goal is fully accomplished, use the "task_complete" tool
7. If you encounter an error, try alternative approaches

**OUTPUT FORMAT:**

You MUST respond with ONLY a valid JSON object in this exact format:

{
  "tool": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}

**EXAMPLES:**

To write a file:
{"tool": "writeFile", "params": {"path": "hello.txt", "content": "Hello, World!"}}

To read a file:
{"tool": "readFile", "params": {"path": "hello.txt"}}

To list directory:
{"tool": "listDirectory", "params": {"path": "."}}

To run a command:
{"tool": "executeShellCommand", "params": {"command": "ls -la"}}

To complete the task:
{"tool": "task_complete", "params": {"reason": "Successfully created and verified the file"}}

**CRITICAL:** Your response must be ONLY the JSON object, with no additional text before or after."""
    
    def determine_next_action(self, goal: str, history: List[tuple]) -> Dict[str, Any]:
        """
        Determine the next action to take based on the goal and history.
        
        Args:
            goal: The user's high-level objective
            history: List of (action, observation) tuples from previous iterations
        
        Returns:
            dict: The next action to take in the format {'tool': '...', 'params': {...}}
        """
        # Build the messages for the API call
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add goal
        messages.append({
            "role": "user",
            "content": f"**GOAL:** {goal}\n\nWhat is the first action you should take?"
        })
        
        # Add history of previous actions and observations
        for i, (action, observation) in enumerate(history, 1):
            # Add the action the agent took
            messages.append({
                "role": "assistant",
                "content": json.dumps(action)
            })
            
            # Add the observation (result) from that action
            messages.append({
                "role": "user",
                "content": f"**OBSERVATION {i}:**\n{observation}\n\nWhat is the next action?"
            })
        
        try:
            # Call the OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            # Extract the response content
            response_text = response.choices[0].message.content.strip()
            
            # Parse the JSON response
            try:
                action = json.loads(response_text)
                
                # Validate the action has required keys
                if 'tool' not in action:
                    raise ValueError("Response missing 'tool' key")
                if 'params' not in action:
                    action['params'] = {}
                
                return action
                
            except json.JSONDecodeError as e:
                # Try to extract JSON from the response if it has extra text
                # Look for JSON object in the response
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                
                if start >= 0 and end > start:
                    json_str = response_text[start:end]
                    action = json.loads(json_str)
                    
                    if 'tool' not in action:
                        raise ValueError("Response missing 'tool' key")
                    if 'params' not in action:
                        action['params'] = {}
                    
                    return action
                else:
                    raise ValueError(f"Could not parse JSON from LLM response: {response_text}")
        
        except Exception as e:
            # Return an error action that will be visible to the user
            return {
                "tool": "error",
                "params": {
                    "message": f"Error communicating with LLM: {str(e)}"
                }
            }
