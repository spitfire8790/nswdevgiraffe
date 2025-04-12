"""
Simple test script using the Google ADK pattern from the GitHub example
"""

from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
import uuid

def main():
    # Define a single agent exactly as in the GitHub example
    search_agent = Agent(
        name="search_assistant",
        model="gemini-1.5-flash",
        instruction="You are a helpful assistant. Answer user questions about property information.",
        description="An assistant that can search for property information.",
        tools=[]  # No tools for simplicity
    )
    
    # Create a runner with the agent
    runner = InMemoryRunner(app_name="TestApp", agent=search_agent)
    
    # Generate IDs
    user_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    
    # Test prompt
    prompt = "Tell me about 1-5 KHARTOUM ROAD MACQUARIE PARK 2113"
    
    print(f"Running agent with user_id={user_id}, session_id={session_id}")
    print(f"Prompt: {prompt}")
    
    # Run the agent and collect events
    try:
        events = list(runner.run(user_id=user_id, session_id=session_id, new_message=prompt))
        print(f"Received {len(events)} events")
        
        for i, event in enumerate(events):
            print(f"Event {i+1}:")
            if hasattr(event, 'parts'):
                for part in event.parts:
                    if hasattr(part, 'text'):
                        print(f"Text: {part.text[:100]}...")
            else:
                print(f"Event without parts: {event}")
    except Exception as e:
        print(f"Error during agent run: {str(e)}")

if __name__ == "__main__":
    main() 