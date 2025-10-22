"""
Tool Executor module for BiB! Lite Agent.
Executes approved actions using predefined tools within a sandboxed environment.
"""

import subprocess
from pathlib import Path
from typing import Dict, Any
from safety import is_path_safe
from config import WORKSPACE_PATH


class ToolExecutor:
    """
    Handles execution of tools/actions for the agent.
    All file operations are restricted to the workspace directory.
    """
    
    def __init__(self, workspace_path: Path):
        """
        Initialize the ToolExecutor.
        
        Args:
            workspace_path: The safe workspace directory path
        """
        self.workspace_path = workspace_path
        
    def execute_tool(self, command: Dict[str, Any]) -> str:
        """
        Main router function to execute a tool based on the command.
        
        Args:
            command: Dictionary with 'tool' and 'params' keys
                    e.g., {'tool': 'writeFile', 'params': {...}}
        
        Returns:
            str: Result of the tool execution or error message
        """
        tool_name = command.get('tool')
        params = command.get('params', {})
        
        # Route to appropriate tool handler
        if tool_name == 'writeFile':
            return self._write_file(
                params.get('path', ''),
                params.get('content', '')
            )
        elif tool_name == 'readFile':
            return self._read_file(params.get('path', ''))
        elif tool_name == 'listDirectory':
            return self._list_directory(params.get('path', '.'))
        elif tool_name == 'executeShellCommand':
            return self._execute_shell_command(params.get('command', ''))
        elif tool_name == 'task_complete':
            reason = params.get('reason', 'Task completed')
            return f"✅ Task Complete: {reason}"
        else:
            return f"❌ Error: Unknown tool '{tool_name}'"
    
    def _write_file(self, path: str, content: str) -> str:
        """
        Write content to a file in the workspace.
        
        Args:
            path: Relative or absolute path to the file
            content: Content to write to the file
        
        Returns:
            str: Success message or error
        """
        if not path:
            return "❌ Error: No file path provided"
        
        # Security check: Ensure path is within workspace
        if not is_path_safe(path):
            return f"❌ Security Error: Path '{path}' is outside the allowed workspace"
        
        try:
            # Resolve path relative to workspace
            target_path = Path(path)
            if not target_path.is_absolute():
                target_path = self.workspace_path / target_path
            
            # Create parent directories if they don't exist
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write the file
            target_path.write_text(content, encoding='utf-8')
            
            return f"✅ Successfully wrote {len(content)} characters to {target_path.relative_to(self.workspace_path)}"
        except Exception as e:
            return f"❌ Error writing file: {str(e)}"
    
    def _read_file(self, path: str) -> str:
        """
        Read content from a file in the workspace.
        
        Args:
            path: Relative or absolute path to the file
        
        Returns:
            str: File content or error message
        """
        if not path:
            return "❌ Error: No file path provided"
        
        # Security check: Ensure path is within workspace
        if not is_path_safe(path):
            return f"❌ Security Error: Path '{path}' is outside the allowed workspace"
        
        try:
            # Resolve path relative to workspace
            target_path = Path(path)
            if not target_path.is_absolute():
                target_path = self.workspace_path / target_path
            
            # Check if file exists
            if not target_path.exists():
                return f"❌ Error: File '{target_path.relative_to(self.workspace_path)}' does not exist"
            
            if not target_path.is_file():
                return f"❌ Error: '{target_path.relative_to(self.workspace_path)}' is not a file"
            
            # Read the file
            content = target_path.read_text(encoding='utf-8')
            
            return f"✅ File content ({len(content)} characters):\n\n{content}"
        except Exception as e:
            return f"❌ Error reading file: {str(e)}"
    
    def _list_directory(self, path: str = '.') -> str:
        """
        List contents of a directory in the workspace.
        
        Args:
            path: Relative or absolute path to the directory (default: workspace root)
        
        Returns:
            str: Directory listing or error message
        """
        # Security check: Ensure path is within workspace
        if not is_path_safe(path):
            return f"❌ Security Error: Path '{path}' is outside the allowed workspace"
        
        try:
            # Resolve path relative to workspace
            target_path = Path(path)
            if not target_path.is_absolute():
                target_path = self.workspace_path / target_path
            
            # Check if directory exists
            if not target_path.exists():
                return f"❌ Error: Directory '{target_path.relative_to(self.workspace_path)}' does not exist"
            
            if not target_path.is_dir():
                return f"❌ Error: '{target_path.relative_to(self.workspace_path)}' is not a directory"
            
            # List directory contents
            items = []
            for item in sorted(target_path.iterdir()):
                item_type = "📁" if item.is_dir() else "📄"
                rel_path = item.relative_to(self.workspace_path)
                items.append(f"{item_type} {rel_path}")
            
            if not items:
                return f"✅ Directory '{target_path.relative_to(self.workspace_path)}' is empty"
            
            return f"✅ Directory listing for '{target_path.relative_to(self.workspace_path)}':\n\n" + "\n".join(items)
        except Exception as e:
            return f"❌ Error listing directory: {str(e)}"
    
    def _execute_shell_command(self, shell_command: str) -> str:
        """
        Execute a shell command in the workspace directory.
        
        Args:
            shell_command: The shell command to execute
        
        Returns:
            str: Command output (stdout + stderr) or error message
        """
        if not shell_command:
            return "❌ Error: No command provided"
        
        try:
            # Execute the command with workspace as current directory
            # This sandboxes the command execution to the workspace
            result = subprocess.run(
                shell_command,
                shell=True,
                cwd=str(self.workspace_path),
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout to prevent hanging
            )
            
            # Combine stdout and stderr
            output = ""
            if result.stdout:
                output += f"STDOUT:\n{result.stdout}\n"
            if result.stderr:
                output += f"STDERR:\n{result.stderr}\n"
            
            # Include exit code
            output += f"\nExit Code: {result.returncode}"
            
            if result.returncode == 0:
                return f"✅ Command executed successfully:\n\n{output}"
            else:
                return f"⚠️  Command executed with errors:\n\n{output}"
            
        except subprocess.TimeoutExpired:
            return "❌ Error: Command timed out after 30 seconds"
        except Exception as e:
            return f"❌ Error executing command: {str(e)}"
