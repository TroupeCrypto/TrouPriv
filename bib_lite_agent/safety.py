"""
Safety module for BiB! Lite Agent.
Provides human-in-the-loop approval and path sandboxing for secure agent operations.
"""

from pathlib import Path
from typing import Dict, Any
from config import WORKSPACE_PATH


def human_in_the_loop_approval(command: Dict[str, Any]) -> bool:
    """
    Request human approval before executing a command.
    
    Args:
        command: Dictionary containing the tool and parameters to execute
                 e.g., {'tool': 'writeFile', 'params': {'path': '...', 'content': '...'}}
    
    Returns:
        bool: True if user approves the command, False otherwise
    """
    print("\n" + "="*70)
    print("🤖 AGENT WANTS TO PERFORM THE FOLLOWING ACTION:")
    print("="*70)
    print(f"Tool: {command.get('tool', 'Unknown')}")
    
    params = command.get('params', {})
    if params:
        print("\nParameters:")
        for key, value in params.items():
            # Truncate long content for readability
            if isinstance(value, str) and len(value) > 200:
                display_value = value[:200] + "... [truncated]"
            else:
                display_value = value
            print(f"  {key}: {display_value}")
    
    print("="*70)
    
    # Get user input
    while True:
        response = input("\n🔐 Do you approve this action? [Y/n]: ").strip().lower()
        
        if response in ['y', 'yes', '']:
            print("✅ Action approved!")
            return True
        elif response in ['n', 'no']:
            print("❌ Action declined!")
            return False
        else:
            print("Invalid input. Please enter 'Y' for yes or 'n' for no.")


def is_path_safe(path: str) -> bool:
    """
    Check if a file path is within the allowed workspace directory.
    This is a critical security function to prevent the agent from accessing
    files outside its designated sandbox.
    
    Args:
        path: The file path to check
    
    Returns:
        bool: True if the path is safe (within workspace), False otherwise
    """
    try:
        # Convert to Path object and resolve to absolute path
        target_path = Path(path)
        
        # If path is relative, resolve it relative to workspace
        if not target_path.is_absolute():
            target_path = WORKSPACE_PATH / target_path
        
        # Resolve any symlinks and relative components (.., .)
        target_path = target_path.resolve()
        
        # Check if the resolved path is within the workspace
        # Use relative_to() to verify the path is a child of workspace
        try:
            target_path.relative_to(WORKSPACE_PATH)
            return True
        except ValueError:
            # Path is outside workspace
            return False
            
    except (OSError, RuntimeError) as e:
        # Handle any path resolution errors
        print(f"⚠️  Path resolution error: {e}")
        return False
