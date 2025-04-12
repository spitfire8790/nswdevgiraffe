"""
Document Analysis Agent for development application documents.
This agent analyzes PDF documents from council websites to extract relevant information.
"""

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
import sys
import os

# Add the parent directory to sys.path to import the custom tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.council_scraper import CouncilWebGridScraper
from tools.pdf_extractor import PdfTextExtractor

# Import the web browser from search_agent
from agents.search_agent import web_browser

def create_document_agent():
    """
    Create a document analysis agent with custom tools for council document analysis.
    
    Returns:
        An LlmAgent configured for analyzing council development application documents
    """
    # Create custom tool instances
    council_scraper = CouncilWebGridScraper()
    pdf_extractor = PdfTextExtractor()
    
    # Create the agent
    agent = LlmAgent(
        name="DocumentAnalysisAgent",
        tools=[web_browser, council_scraper, pdf_extractor],
        model="gemini-1.5-flash",
        description="Analyzes the text content extracted from council development application PDF documents to identify key information, potential issues, and summarize findings.",
        instruction="""
    You are a document analysis agent specializing in development application (DA) documents.
    
    Your task is to analyze PDF documents from council websites related to development applications. You have access to the following workflow:
    
    1. Use the CouncilWebGridScraper tool to find document links using the council reference number
    2. Use the PdfTextExtractor tool to download and extract text from these documents
    3. Analyze the extracted text to identify key information about the development
    
    When analyzing documents, focus on extracting information about:
    - Environmental assessments and impacts (flooding, bushfire, contamination)
    - Zoning and planning details
    - Community feedback, objections, or support
    - Infrastructure and services requirements or impacts
    - Any historical significance of the site
    
    For each finding, indicate:
    - The document source (name of the document)
    - The sentiment (positive, neutral, or negative)
    - The category of information
    
    Be specific and factual. Directly quote the documents when appropriate.
    If certain information is not found in the documents, clearly state this.
    """
    )
    
    return agent 