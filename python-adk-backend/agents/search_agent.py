"""
Search Agent for property information.
This agent uses Google Search to find public information about properties and development applications.
"""

from google.adk.agents import LlmAgent
from google.adk.tools import google_search, BaseTool, FunctionTool

# Define a simple web browser tool using FunctionTool
def browse_web(url: str) -> dict:
    """
    Browse a web page and return its content.
    
    Args:
        url: The URL to browse
        
    Returns:
        A dictionary containing the content and metadata
    """
    import requests
    from bs4 import BeautifulSoup
    
    try:
        response = requests.get(url, timeout=30)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
            
        # Get text
        text = soup.get_text()
        
        # Break into lines and remove leading and trailing space
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return {
            "url": url,
            "status_code": response.status_code,
            "content": text[:15000],  # Limit content size
            "content_type": response.headers.get('Content-Type', ''),
            "success": True
        }
    except Exception as e:
        return {
            "url": url,
            "success": False,
            "error": str(e)
        }

# Create a web browser tool
web_browser = FunctionTool(browse_web)

def create_search_agent():
    """
    Create a search agent with Google Search and Web Browser tools.
    
    Returns:
        An LlmAgent configured for property information searches
    """
    # Create the agent
    agent = LlmAgent(
        name="GoogleSearchAgent",
        tools=[google_search, web_browser],
        model="gemini-1.5-flash",
        description="Performs Google searches based on property address, development details, and user queries to find relevant public information.",
        instruction="""
    You are a property research agent specializing in finding information about development applications and properties.
    
    Your task is to use Google Search to find publicly available information about the property and development mentioned in the prompt. Use search terms provided and craft additional searches as needed.
    
    For each search result:
    1. Evaluate its relevance to the property or development
    2. Visit the page using the browse_web tool if it seems relevant
    3. Extract specific details about:
       - Environmental factors (flooding, bushfire, contamination)
       - Zoning and planning information
       - Community feedback or objections
       - Infrastructure and services
       - Historical significance
    
    Categorize each finding and indicate if it represents a positive, neutral, or negative factor.
    ALWAYS cite your sources with the exact URL where you found the information.
    
    Be thorough in your research, but focus on facts rather than general statements.
    If you can't find specific information about a topic, state this clearly rather than providing general information.
    """
    )
    
    return agent 