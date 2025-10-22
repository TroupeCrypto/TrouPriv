"""
Configuration module for BiB! Lite Agent.
Manages environment variables and application settings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

if not OPENAI_API_KEY or OPENAI_API_KEY == "your_key_here":
    print("⚠️  Warning: OPENAI_API_KEY is not set or is using the default placeholder.")
    print("   Please copy .env.example to .env and update with your actual OpenAI API key.")

# Workspace path - where the agent is allowed to operate
WORKSPACE_PATH = Path(__file__).parent / "workspace"
WORKSPACE_PATH = WORKSPACE_PATH.resolve()  # Convert to absolute path

# Ensure workspace directory exists
WORKSPACE_PATH.mkdir(exist_ok=True)

# Agent configuration
MAX_ITERATIONS = 10  # Maximum number of think-act-observe cycles
LLM_MODEL = "gpt-4-turbo"  # The LLM model to use for agent reasoning
