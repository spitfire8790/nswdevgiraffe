"""
Simple test script to create the coordinator agent.
"""

from agents.coordinator_agent import create_coordinator_agent

def main():
    # Create the coordinator agent
    coordinator = create_coordinator_agent()
    
    # Print the sub-agents
    print(f"Successfully created coordinator agent with sub-agents:")
    for agent in coordinator.sub_agents:
        print(f"  - {agent.name}: {agent.description}")
    
    print("Coordinator setup successful!")

if __name__ == "__main__":
    main() 