"""
Coordinator Agent for property information research.
This agent orchestrates the search and document analysis agents to provide comprehensive property research.
"""

from google.adk.agents import LlmAgent
from agents.search_agent import create_search_agent
from agents.document_agent import create_document_agent

def create_coordinator_agent():
    """
    Create a coordinator agent that orchestrates search and document analysis.
    
    Returns:
        A coordinator LlmAgent that manages sub-agents
    """
    # Create sub-agents
    search_agent = create_search_agent()
    document_agent = create_document_agent()
    
    # Create coordinator agent
    coordinator = LlmAgent(
        name="PropertyResearchCoordinator",
        model="gemini-1.5-flash",
        description="Coordinates property research by delegating to specialized sub-agents",
        instruction="""
        You are a property research coordinator. Based on the user's query:
        
        1. If they mention a council reference or development application number, use the DocumentAnalysisAgent to analyze specific council documents
        2. For general property information or when no council reference is available, use the GoogleSearchAgent to find information online
        3. When both types of information would be valuable, coordinate the work of both agents and synthesize their findings
        
        Always provide a comprehensive response that clearly cites sources.
        
        When analyzing property information, focus on:
        - Environmental factors (flooding, bushfire, contamination)
        - Zoning and planning information
        - Community feedback or objections
        - Infrastructure and services
        - Historical significance
        
        For each finding, indicate if it represents a positive, neutral, or negative factor.
        ALWAYS cite your sources with the exact URL or document name where you found the information.
        """,
        sub_agents=[
            search_agent,
            document_agent
        ]
    )
    
    return coordinator 