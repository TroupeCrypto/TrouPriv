#!/usr/bin/env python3
"""
Test script for BiB! Lite Agent
Demonstrates the agent's capabilities without requiring an API key
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from tool_executor import ToolExecutor
from safety import is_path_safe
import config


def test_safety():
    """Test the safety module"""
    print("\n" + "="*70)
    print("TEST 1: Path Safety Checks")
    print("="*70)
    
    test_cases = [
        ("test.txt", True, "Relative path in workspace"),
        ("./test.txt", True, "Explicit relative path"),
        ("subdir/file.txt", True, "Subdirectory path"),
        ("../outside.txt", False, "Parent directory traversal"),
        ("/etc/passwd", False, "Absolute system path"),
        (str(config.WORKSPACE_PATH / "safe.txt"), True, "Absolute workspace path"),
    ]
    
    passed = 0
    failed = 0
    
    for path, expected, description in test_cases:
        result = is_path_safe(path)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"  {status} {description}")
        print(f"     Path: {path}")
        print(f"     Result: {result}, Expected: {expected}")
    
    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_tool_executor():
    """Test the tool executor"""
    print("\n" + "="*70)
    print("TEST 2: Tool Executor")
    print("="*70)
    
    executor = ToolExecutor(config.WORKSPACE_PATH)
    
    tests = []
    
    # Test 1: Write file
    print("\n  Test 2.1: Write File")
    result = executor.execute_tool({
        'tool': 'writeFile',
        'params': {
            'path': 'test_output.txt',
            'content': 'Hello from BiB! Lite!\nThis is a test file.'
        }
    })
    success = '✅' in result
    tests.append(success)
    print(f"    {'✓' if success else '✗'} Write file: {result[:100]}")
    
    # Test 2: Read file
    print("\n  Test 2.2: Read File")
    result = executor.execute_tool({
        'tool': 'readFile',
        'params': {'path': 'test_output.txt'}
    })
    success = '✅' in result and 'Hello from BiB! Lite!' in result
    tests.append(success)
    print(f"    {'✓' if success else '✗'} Read file: {'Content matches' if success else 'Content mismatch'}")
    
    # Test 3: List directory
    print("\n  Test 2.3: List Directory")
    result = executor.execute_tool({
        'tool': 'listDirectory',
        'params': {'path': '.'}
    })
    success = '✅' in result and 'test_output.txt' in result
    tests.append(success)
    print(f"    {'✓' if success else '✗'} List directory: {'File found' if success else 'File not found'}")
    
    # Test 4: Execute shell command
    print("\n  Test 2.4: Execute Shell Command")
    result = executor.execute_tool({
        'tool': 'executeShellCommand',
        'params': {'command': 'echo "Test command"'}
    })
    success = '✅' in result and 'Test command' in result
    tests.append(success)
    print(f"    {'✓' if success else '✗'} Shell command: {'Output correct' if success else 'Output incorrect'}")
    
    # Test 5: Security - unsafe path
    print("\n  Test 2.5: Security Check - Unsafe Path")
    result = executor.execute_tool({
        'tool': 'writeFile',
        'params': {
            'path': '/etc/passwd',
            'content': 'This should not work'
        }
    })
    success = 'Security Error' in result
    tests.append(success)
    print(f"    {'✓' if success else '✗'} Unsafe path blocked: {success}")
    
    # Test 6: Task complete
    print("\n  Test 2.6: Task Complete")
    result = executor.execute_tool({
        'tool': 'task_complete',
        'params': {'reason': 'All tests completed'}
    })
    success = '✅' in result and 'Task Complete' in result
    tests.append(success)
    print(f"    {'✓' if success else '✗'} Task complete: {result}")
    
    passed = sum(tests)
    total = len(tests)
    print(f"\n  Results: {passed}/{total} tests passed")
    
    return passed == total


def test_configuration():
    """Test configuration"""
    print("\n" + "="*70)
    print("TEST 3: Configuration")
    print("="*70)
    
    print(f"  Workspace Path: {config.WORKSPACE_PATH}")
    print(f"  Max Iterations: {config.MAX_ITERATIONS}")
    print(f"  LLM Model: {config.LLM_MODEL}")
    print(f"  Workspace Exists: {config.WORKSPACE_PATH.exists()}")
    print(f"  Workspace is Directory: {config.WORKSPACE_PATH.is_dir()}")
    
    return config.WORKSPACE_PATH.exists() and config.WORKSPACE_PATH.is_dir()


def main():
    """Run all tests"""
    print("="*70)
    print("BiB! Lite Agent - Test Suite")
    print("="*70)
    
    results = []
    
    # Run tests
    results.append(("Configuration", test_configuration()))
    results.append(("Path Safety", test_safety()))
    results.append(("Tool Executor", test_tool_executor()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"  {status}: {name}")
    
    all_passed = all(passed for _, passed in results)
    
    if all_passed:
        print("\n✅ All tests passed!")
        return 0
    else:
        print("\n❌ Some tests failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
