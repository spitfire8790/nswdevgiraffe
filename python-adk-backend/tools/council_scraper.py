"""
Tool for scraping council websites to find development application documents.
This tool currently supports Ryde Council's KapishWebGrid system.
"""

import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
from google.adk.tools import FunctionTool

class CouncilWebGridScraper(FunctionTool):
    """Tool that scrapes council websites for development application documents."""
    
    def __init__(self):
        super().__init__(self.scrape_council_website)
        
    def scrape_council_website(self, council_reference: str, lga: str = "") -> List[Dict[str, str]]:
        """
        Find document links for a specific development application on a council website.
        
        Args:
            council_reference: The council's reference number for the development application
            lga: The Local Government Area (e.g., "RYDE"). Currently only Ryde is supported.
            
        Returns:
            A list of dictionaries containing document information: 
            [{"title": "Document Title", "url": "https://document-url.pdf"}, ...]
        """
        lga = lga.upper() if lga else ""
        
        # Currently, only Ryde Council is supported
        if lga != "RYDE" and not lga.startswith("RYDE"):
            return [{"error": f"LGA '{lga}' is not supported. Currently only Ryde Council is supported."}]
        
        try:
            # Construct the URL for Ryde Council's KapishWebGrid
            url = f"https://cmweb.ryde.nsw.gov.au/KapishWebGrid/default.aspx?s=DATracker&containerex={council_reference}/0010"
            
            # Send the HTTP request
            response = requests.get(url, timeout=30)
            
            # Check if the request was successful
            if response.status_code != 200:
                return [{"error": f"Failed to access council website. Status code: {response.status_code}"}]
            
            # Parse the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find document links - this will need to be adjusted based on the actual structure of the page
            documents = []
            
            # Look for the table that contains document links
            # This is specific to Ryde's KapishWebGrid and may need adjustment
            table = soup.find('table', {'class': 'rgMasterTable'})
            
            if not table:
                # If we can't find the main table, try looking for any links
                links = soup.find_all('a')
                for link in links:
                    href = link.get('href')
                    if href and (href.endswith('.pdf') or 'document' in href.lower()):
                        title = link.text.strip() or "Document"
                        documents.append({
                            "title": title,
                            "url": href if href.startswith('http') else f"https://cmweb.ryde.nsw.gov.au{href}"
                        })
            else:
                # If we found the table, extract links from it
                rows = table.find_all('tr')
                for row in rows:
                    # Skip header row
                    if row.find('th'):
                        continue
                    
                    # Look for cells and links
                    cells = row.find_all('td')
                    if len(cells) >= 2:  # Assuming first cell is title, second might contain link
                        title_cell = cells[0]
                        title = title_cell.text.strip()
                        
                        # Find any links in the row
                        link = row.find('a')
                        if link and link.get('href'):
                            href = link.get('href')
                            url = href if href.startswith('http') else f"https://cmweb.ryde.nsw.gov.au{href}"
                            documents.append({"title": title, "url": url})
            
            # If no documents found, return an informative message
            if not documents:
                return [{"info": f"No documents found for council reference {council_reference} at Ryde Council."}]
            
            return documents
            
        except requests.exceptions.RequestException as e:
            return [{"error": f"Failed to connect to council website: {str(e)}"}]
        except Exception as e:
            return [{"error": f"An unexpected error occurred: {str(e)}"}] 