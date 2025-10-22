#!/usr/bin/env python3
"""
Example usage of BiB! Lite Agent without human-in-the-loop
(For demonstration purposes only - not recommended for production)
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from tool_executor import ToolExecutor
from agent_core import AgentCore
import config


def simulate_task():
    """
    Simulate a task execution without the FastAPI server
    This demonstrates the agent's Think -> Act -> Observe loop
    """
    print("="*70)
    print("BiB! Lite Agent - Simulation Mode")
    print("="*70)
    print("\nNote: This simulation bypasses human approval for demonstration.")
    print("In production, use the FastAPI server with human-in-the-loop.\n")
    
    # Check if API key is configured
    if not config.OPENAI_API_KEY or config.OPENAI_API_KEY == "your_key_here":
        print("❌ OPENAI_API_KEY not configured.")
        print("   This simulation cannot run without a valid API key.")
        print("\nTo run this simulation:")
        print("1. Copy .env.example to .env")
        print("2. Add your OpenAI API key to .env")
        print("3. Run this script again")
        return
    
    # Initialize components
    print("Initializing agent components...")
    agent_core = AgentCore(api_key=config.OPENAI_API_KEY)
    tool_executor = ToolExecutor(workspace_path=config.WORKSPACE_PATH)
    
    # Define a simple goal
    goal = "Create a file called hello.txt with the text 'Hello, World!'"
    
    print(f"\nGoal: {goal}")
    print(f"Workspace: {config.WORKSPACE_PATH}")
    print("\n" + "="*70)
    
    # History of (action, observation) pairs
    history = []
    
    # Main agent loop
    for iteration in range(1, config.MAX_ITERATIONS + 1):
        print(f"\n{'='*70}")
        print(f"ITERATION {iteration}")
        print(f"{'='*70}")
        
        # THINK
        print("\n💭 THINKING...")
        action = agent_core.determine_next_action(goal, history)
        
        # Check for errors
        if action.get('tool') == 'error':
            error_msg = action.get('params', {}).get('message', 'Unknown error')
            print(f"❌ Error: {error_msg}")
            break
        
        # Check if complete
        if action.get('tool') == 'task_complete':
            reason = action.get('params', {}).get('reason', 'Task completed')
            print(f"\n✅ {reason}")
            break
        
        print(f"   Action: {action.get('tool')}")
        print(f"   Params: {action.get('params')}")
        
        # ACT (without human approval in simulation)
        print("\n⚙️  ACTING...")
        observation = tool_executor.execute_tool(action)
        
        # OBSERVE
        print("\n👁️  OBSERVATION:")
        print(f"   {observation}")
        
        # Update history
        history.append((action, observation))
    
    print("\n" + "="*70)
    print("Simulation Complete")
    print("="*70)


if __name__ == "__main__":
    simulate_task()
