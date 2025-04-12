"""
Simple script to check what tools are available in google.adk.tools.
"""

import inspect
import importlib
import google.adk.tools

def main():
    # Print all public modules, classes, and functions from google.adk.tools
    print("Available in google.adk.tools:")
    for name in dir(google.adk.tools):
        if not name.startswith("_"):  # Skip private members
            print(f"  - {name}")
    
    # Also check if we can import them directly
    print("\nChecking specific imports:")
    
    tools_to_check = [
        "google_search", 
        "web_browser", 
        "GoogleSearchTool", 
        "WebBrowser",
        "BaseTool",
        "FunctionTool"
    ]
    
    for tool in tools_to_check:
        try:
            # Try to import from the module
            attr = getattr(google.adk.tools, tool, None)
            if attr is not None:
                print(f"  ✓ {tool} exists")
            else:
                print(f"  ✗ {tool} does not exist in google.adk.tools")
                
            # Try to import as a submodule
            try:
                module = importlib.import_module(f"google.adk.tools.{tool}")
                print(f"  ✓ google.adk.tools.{tool} exists as a module")
            except ImportError:
                print(f"  ✗ google.adk.tools.{tool} does not exist as a module")
        except Exception as e:
            print(f"  ! Error checking {tool}: {e}")

if __name__ == "__main__":
    main() 