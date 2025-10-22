# BiB! Lite Agent

A minimal, production-ready AI agent that operates on a "Think → Act → Observe" loop with human-in-the-loop approval and sandboxed execution.

## Overview

BiB! Lite is a sandboxed AI agent that can:
- Write and read files
- List directory contents
- Execute shell commands (within the workspace)
- All actions require human approval before execution

## Architecture

```
Think → Act → Observe Loop:
1. THINK: LLM analyzes goal and history, proposes next action
2. SAFETY: Human approves or rejects the proposed action
3. ACT: Execute the approved action in the sandboxed workspace
4. OBSERVE: Capture the result to inform the next iteration
```

## File Structure

```
/bib_lite_agent/
├── main.py              # FastAPI app and main agent loop
├── agent_core.py        # LLM integration and decision-making
├── tool_executor.py     # Tool execution (file ops, shell commands)
├── safety.py            # Human-in-the-loop and path sandboxing
├── config.py            # Configuration and environment variables
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (API key)
└── workspace/           # Sandboxed directory for agent operations
```

## Installation

1. **Install dependencies:**
   ```bash
   cd bib_lite_agent
   pip install -r requirements.txt
   ```

2. **Configure OpenAI API Key:**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file and replace `your_key_here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY="sk-your-actual-key-here"
   ```

## Usage

### Running the Agent

Start the FastAPI server:

```bash
cd bib_lite_agent
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

### Executing a Task

Make a POST request to `/execute_task` with a goal:

**Using curl:**
```bash
curl -X POST "http://localhost:8000/execute_task" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create a file called hello.txt with the text Hello, World!"}'
```

**Using Python requests:**
```python
import requests

response = requests.post(
    "http://localhost:8000/execute_task",
    json={"goal": "Create a Python script that prints fibonacci numbers"}
)
print(response.json())
```

**Using the API docs:**
Navigate to `http://localhost:8000/docs` for interactive API documentation.

### Agent Interaction

When the agent proposes an action, you'll see:

```
==================================================================
🤖 AGENT WANTS TO PERFORM THE FOLLOWING ACTION:
==================================================================
Tool: writeFile

Parameters:
  path: hello.txt
  content: Hello, World!
==================================================================

🔐 Do you approve this action? [Y/n]:
```

- Type `Y` or `y` (or just press Enter) to approve
- Type `N` or `n` to reject and abort the task

## Available Tools

The agent can use the following tools:

1. **writeFile** - Write content to a file
   - Parameters: `path` (string), `content` (string)

2. **readFile** - Read content from a file
   - Parameters: `path` (string)

3. **listDirectory** - List directory contents
   - Parameters: `path` (string, default: ".")

4. **executeShellCommand** - Execute a shell command
   - Parameters: `command` (string)

5. **task_complete** - Signal task completion
   - Parameters: `reason` (string)

## Security Features

### 1. Human-in-the-Loop Approval
Every action must be explicitly approved by a human before execution. This prevents:
- Unintended file modifications
- Dangerous command execution
- Runaway agent behavior

### 2. Path Sandboxing
All file operations are restricted to the `workspace/` directory:
- Paths outside workspace are automatically rejected
- Prevents system file access
- Uses path resolution to detect traversal attempts (`../`, symlinks, etc.)

### 3. Command Sandboxing
Shell commands are executed with:
- `cwd` set to the workspace directory
- 30-second timeout to prevent hanging
- Captured output (stdout/stderr) for review

## Configuration

Edit `config.py` to customize:

```python
MAX_ITERATIONS = 10      # Maximum think-act-observe cycles
LLM_MODEL = "gpt-4-turbo"  # OpenAI model to use
WORKSPACE_PATH           # Sandboxed workspace directory
```

## Example Tasks

### Simple File Creation
```json
{
  "goal": "Create a file called notes.txt with a list of 3 programming languages"
}
```

### Python Script Generation
```json
{
  "goal": "Create a Python script that calculates the factorial of a number"
}
```

### Multi-Step Task
```json
{
  "goal": "Create a directory called scripts, then create a bash script in it that prints the current date"
}
```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /execute_task` - Execute a task with the agent

## Troubleshooting

### "OPENAI_API_KEY is not set" Warning

Make sure you've:
1. Created/edited the `.env` file
2. Set a valid OpenAI API key
3. Restarted the server

### "Path is outside the allowed workspace" Error

The agent tried to access a file outside the workspace. This is blocked for security. Make sure all paths are relative to the workspace.

### Agent Not Completing Task

If the agent reaches `MAX_ITERATIONS` without completing:
1. Check if the goal is clear and achievable
2. Review the action history in the response
3. Increase `MAX_ITERATIONS` in `config.py` if needed

## Development

### Running Tests

Since this is a production-ready implementation, you can test it by:

1. **Manual testing** with various goals
2. **Monitoring the console** for agent behavior
3. **Inspecting the workspace** directory after execution

### Extending the Agent

To add new tools:

1. Add the tool to `tool_executor.py`:
   ```python
   def _my_new_tool(self, param1: str) -> str:
       # Implementation
       pass
   ```

2. Update the router in `execute_tool()`:
   ```python
   elif tool_name == 'myNewTool':
       return self._my_new_tool(params.get('param1', ''))
   ```

3. Update the system prompt in `agent_core.py` to document the new tool

## License

This is a demonstration implementation for educational purposes.

## Technical Stack

- **Python 3.11+**
- **FastAPI** - Web framework
- **OpenAI API** - LLM integration
- **uvicorn** - ASGI server
- **python-dotenv** - Environment management
