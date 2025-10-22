"""
BiB! Lite Agent - Main Application
FastAPI application that runs the agent's Think → Act → Observe loop.

To run this application:
    uvicorn main:app --reload

Then make a POST request to http://localhost:8000/execute_task with:
    {
        "goal": "Create a file called hello.txt with the text 'Hello, World!'"
    }
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Dict, Any
import uvicorn

from config import OPENAI_API_KEY, WORKSPACE_PATH, MAX_ITERATIONS
from agent_core import AgentCore
from tool_executor import ToolExecutor
from safety import human_in_the_loop_approval


# Initialize FastAPI app
app = FastAPI(
    title="BiB! Lite Agent",
    description="A minimal AI agent with Think → Act → Observe loop",
    version="1.0.0"
)

# Initialize agent components
# Note: AgentCore is initialized lazily to avoid import-time errors
agent_core = None
tool_executor = ToolExecutor(workspace_path=WORKSPACE_PATH)


def get_agent_core():
    """Lazy initialization of AgentCore"""
    global agent_core
    if agent_core is None:
        if not OPENAI_API_KEY or OPENAI_API_KEY == "your_key_here":
            raise ValueError("OPENAI_API_KEY is not configured. Please set it in .env file.")
        agent_core = AgentCore(api_key=OPENAI_API_KEY)
    return agent_core


class TaskRequest(BaseModel):
    """Request model for task execution"""
    goal: str


class TaskResponse(BaseModel):
    """Response model for task execution"""
    success: bool
    message: str
    iterations: int
    history: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "BiB! Lite Agent",
        "version": "1.0.0",
        "description": "A minimal AI agent with Think → Act → Observe loop",
        "endpoints": {
            "/execute_task": "POST - Execute a task with the agent",
            "/health": "GET - Health check endpoint"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "workspace": str(WORKSPACE_PATH),
        "max_iterations": MAX_ITERATIONS
    }


@app.post("/execute_task", response_model=TaskResponse)
async def execute_task(request: TaskRequest):
    """
    Execute a task using the BiB! Lite agent.
    
    The agent will iteratively:
    1. Think: Use LLM to determine next action
    2. Act: Execute the action (after human approval)
    3. Observe: Capture the result and update history
    
    Args:
        request: TaskRequest containing the goal
    
    Returns:
        TaskResponse with execution results
    """
    goal = request.goal
    
    if not goal:
        raise HTTPException(status_code=400, detail="Goal cannot be empty")
    
    # Initialize agent core (lazy initialization)
    try:
        core = get_agent_core()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    print("\n" + "="*70)
    print("🚀 STARTING BiB! LITE AGENT")
    print("="*70)
    print(f"Goal: {goal}")
    print(f"Workspace: {WORKSPACE_PATH}")
    print(f"Max Iterations: {MAX_ITERATIONS}")
    print("="*70 + "\n")
    
    # Initialize history - stores (action, observation) tuples
    history: List[Tuple[Dict[str, Any], str]] = []
    
    # Main agent loop
    for iteration in range(1, MAX_ITERATIONS + 1):
        print(f"\n{'='*70}")
        print(f"🔄 ITERATION {iteration}/{MAX_ITERATIONS}")
        print(f"{'='*70}\n")
        
        # ====================
        # STEP 1: THINK
        # ====================
        print("💭 THINKING: Determining next action...")
        action = core.determine_next_action(goal, history)
        
        # Check for LLM errors
        if action.get('tool') == 'error':
            error_msg = action.get('params', {}).get('message', 'Unknown error')
            print(f"\n❌ LLM Error: {error_msg}")
            return TaskResponse(
                success=False,
                message=f"LLM Error: {error_msg}",
                iterations=iteration,
                history=[{"action": a, "observation": o} for a, o in history]
            )
        
        print(f"   Proposed action: {action.get('tool')}")
        
        # Check if task is complete
        if action.get('tool') == 'task_complete':
            reason = action.get('params', {}).get('reason', 'Task completed')
            print(f"\n✅ {reason}")
            print(f"\nAgent completed the task in {iteration} iteration(s)!")
            
            return TaskResponse(
                success=True,
                message=reason,
                iterations=iteration,
                history=[{"action": a, "observation": o} for a, o in history]
            )
        
        # ====================
        # STEP 2: SAFETY CHECK
        # ====================
        print("\n🔐 SAFETY CHECK: Requesting human approval...")
        
        # Note: In a real production environment, this would be handled differently
        # (e.g., via a web interface, queue system, etc.)
        # For this implementation, it uses console input
        approved = human_in_the_loop_approval(action)
        
        if not approved:
            print("\n⛔ Task aborted by user")
            return TaskResponse(
                success=False,
                message="Task aborted by user - action not approved",
                iterations=iteration,
                history=[{"action": a, "observation": o} for a, o in history]
            )
        
        # ====================
        # STEP 3: ACT
        # ====================
        print("\n⚙️  ACTING: Executing approved action...")
        observation = tool_executor.execute_tool(action)
        
        # ====================
        # STEP 4: OBSERVE
        # ====================
        print("\n👁️  OBSERVATION:")
        print(observation)
        
        # ====================
        # STEP 5: UPDATE HISTORY
        # ====================
        history.append((action, observation))
    
    # Max iterations reached
    print(f"\n⚠️  Maximum iterations ({MAX_ITERATIONS}) reached without completion")
    
    return TaskResponse(
        success=False,
        message=f"Maximum iterations ({MAX_ITERATIONS}) reached without completing the goal",
        iterations=MAX_ITERATIONS,
        history=[{"action": a, "observation": o} for a, o in history]
    )


if __name__ == "__main__":
    # Run the application
    # Use: uvicorn main:app --reload
    print("\n" + "="*70)
    print("BiB! Lite Agent - Starting Server")
    print("="*70)
    print("To execute a task, make a POST request to /execute_task")
    print("Example using curl:")
    print('  curl -X POST "http://localhost:8000/execute_task" \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"goal": "Create a file called test.txt with Hello World"}\'')
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
