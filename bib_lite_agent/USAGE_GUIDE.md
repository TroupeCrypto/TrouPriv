# BiB! Lite Agent - Usage Guide

## Quick Start

### 1. Installation

```bash
cd bib_lite_agent
pip install -r requirements.txt
```

### 2. Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

### 3. Start the Server

```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

### 4. Execute a Task

#### Using curl:
```bash
curl -X POST "http://localhost:8000/execute_task" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create a file called hello.txt with Hello, World!"}'
```

#### Using Python:
```python
import requests

response = requests.post(
    "http://localhost:8000/execute_task",
    json={"goal": "Create a Python script that prints fibonacci numbers"}
)
print(response.json())
```

#### Using the Interactive API Docs:
Navigate to `http://localhost:8000/docs` and use the Swagger UI.

## How It Works

### The Think → Act → Observe Loop

```
1. THINK  → Agent analyzes goal and decides next action
            ↓
2. APPROVE → Human reviews and approves the action
            ↓
3. ACT    → System executes the approved action
            ↓
4. OBSERVE → Result is captured and fed back to agent
            ↓
            (Loop continues until goal achieved)
```

## Example Tasks

### File Operations

**Create a text file:**
```json
{
  "goal": "Create a file called notes.txt with a list of 3 programming languages"
}
```

**Read and modify a file:**
```json
{
  "goal": "Read notes.txt and add Python to the list if it's not there"
}
```

### Script Generation

**Python script:**
```json
{
  "goal": "Create a Python script called factorial.py that calculates factorials"
}
```

**Bash script:**
```json
{
  "goal": "Create a bash script that backs up all .txt files in the current directory"
}
```

### Multi-Step Tasks

**Project setup:**
```json
{
  "goal": "Create a directory called project, then create a README.md and main.py inside it"
}
```

**Data processing:**
```json
{
  "goal": "Create a CSV file with sample data, then write a Python script to read and process it"
}
```

## Human-in-the-Loop Approval

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

**Response options:**
- `Y`, `y`, or press Enter → Approve and continue
- `N` or `n` → Reject and abort the task

## Security Features

### 1. Path Sandboxing

All file operations are restricted to the `workspace/` directory:

✅ **Allowed:**
- `hello.txt`
- `./data/file.txt`
- `subdir/script.py`

❌ **Blocked:**
- `../outside.txt` (parent directory)
- `/etc/passwd` (system files)
- Any path outside workspace

### 2. Command Sandboxing

Shell commands are executed with:
- Working directory set to `workspace/`
- 30-second timeout
- Captured output for review

### 3. Human Approval

Every action requires explicit approval before execution.

## Advanced Usage

### Custom Configuration

Edit `config.py` to customize:

```python
MAX_ITERATIONS = 10          # Maximum think-act cycles
LLM_MODEL = "gpt-4-turbo"   # OpenAI model
WORKSPACE_PATH              # Sandboxed directory
```

### Running Tests

Run the comprehensive test suite:
```bash
python3 test_agent.py
```

This tests:
- Path safety validation
- Tool execution
- Security measures
- Configuration

### Example Simulation

For demonstration without human approval:
```bash
python3 example_simulation.py
```

⚠️ **Note:** This bypasses security checks and is for demonstration only.

## API Reference

### Endpoints

#### `GET /`
Returns API information and available endpoints.

#### `GET /health`
Health check endpoint with configuration details.

**Response:**
```json
{
  "status": "healthy",
  "workspace": "/path/to/workspace",
  "max_iterations": 10
}
```

#### `POST /execute_task`
Execute a task with the agent.

**Request:**
```json
{
  "goal": "Your task description here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task completed successfully",
  "iterations": 3,
  "history": [
    {
      "action": {"tool": "writeFile", "params": {...}},
      "observation": "✅ Successfully wrote..."
    }
  ]
}
```

### Available Tools

#### 1. writeFile
Write content to a file in the workspace.

**Parameters:**
- `path` (string): Relative path to the file
- `content` (string): Content to write

**Example:**
```json
{
  "tool": "writeFile",
  "params": {
    "path": "hello.txt",
    "content": "Hello, World!"
  }
}
```

#### 2. readFile
Read content from a file in the workspace.

**Parameters:**
- `path` (string): Relative path to the file

**Example:**
```json
{
  "tool": "readFile",
  "params": {
    "path": "hello.txt"
  }
}
```

#### 3. listDirectory
List contents of a directory in the workspace.

**Parameters:**
- `path` (string): Relative path to the directory (default: ".")

**Example:**
```json
{
  "tool": "listDirectory",
  "params": {
    "path": "."
  }
}
```

#### 4. executeShellCommand
Execute a shell command in the workspace.

**Parameters:**
- `command` (string): The shell command to execute

**Example:**
```json
{
  "tool": "executeShellCommand",
  "params": {
    "command": "ls -la"
  }
}
```

#### 5. task_complete
Signal that the task is complete.

**Parameters:**
- `reason` (string): Explanation of what was accomplished

**Example:**
```json
{
  "tool": "task_complete",
  "params": {
    "reason": "Successfully created and verified the file"
  }
}
```

## Troubleshooting

### "OPENAI_API_KEY is not configured"

**Solution:**
1. Ensure `.env` file exists (copy from `.env.example`)
2. Add a valid OpenAI API key to `.env`
3. Restart the server

### "Path is outside the allowed workspace"

**Cause:** The agent tried to access a file outside the workspace.

**Solution:** This is working as intended for security. All paths must be relative to the workspace directory.

### Agent reaches MAX_ITERATIONS

**Cause:** The goal may be too complex or unclear.

**Solutions:**
1. Simplify the goal into smaller tasks
2. Make the goal more specific
3. Increase `MAX_ITERATIONS` in `config.py`

### FastAPI server won't start

**Check:**
1. Port 8000 is available (or use `--port` to specify different port)
2. All dependencies are installed (`pip install -r requirements.txt`)
3. Python version is 3.11+ (`python3 --version`)

## Best Practices

### Writing Good Goals

✅ **Good goals:**
- "Create a file called data.txt with three lines of text"
- "Write a Python function that sorts a list"
- "Create a directory called output and a README.md inside it"

❌ **Poor goals:**
- "Do something" (too vague)
- "Create a machine learning model" (too complex)
- "Fix all bugs" (unclear)

### Security Guidelines

1. **Always review actions** before approving
2. **Don't disable** human-in-the-loop approval in production
3. **Monitor** the workspace directory regularly
4. **Limit** the agent's API access using OpenAI's usage limits

### Performance Tips

1. Be specific in your goals to reduce iterations
2. Break complex tasks into smaller subtasks
3. Monitor API usage to control costs

## Development

### Extending the Agent

To add a new tool:

1. **Add tool method** in `tool_executor.py`:
```python
def _my_tool(self, param: str) -> str:
    # Implementation
    return "✅ Tool executed"
```

2. **Update router** in `execute_tool()`:
```python
elif tool_name == 'myTool':
    return self._my_tool(params.get('param'))
```

3. **Update system prompt** in `agent_core.py`:
```python
# Add tool documentation to _create_system_prompt()
```

### Running in Production

Recommendations for production deployment:

1. **Use environment variables** for sensitive configuration
2. **Implement proper logging** (replace print statements)
3. **Add authentication** to API endpoints
4. **Use a production ASGI server** (gunicorn with uvicorn workers)
5. **Set up monitoring** and alerting
6. **Implement rate limiting** for API calls
7. **Use a database** to persist task history

Example production startup:
```bash
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --log-level info
```

## Support

For issues or questions:
- Check the README.md for general information
- Review this usage guide for detailed instructions
- Examine the code comments for implementation details
- Run `test_agent.py` to verify your installation

## License

This is a demonstration implementation for educational purposes.
