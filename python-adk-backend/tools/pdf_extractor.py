"""
Tool for extracting text from PDF documents.
This tool downloads PDFs from URLs and extracts their text content.
"""

import requests
import io
import PyPDF2
from typing import Dict, List, Any, Optional, Union
from google.adk.tools import FunctionTool

class PdfTextExtractor(FunctionTool):
    """Tool that extracts text from PDF documents."""
    
    def __init__(self):
        super().__init__(self.extract_pdf_text)
    
    def extract_pdf_text(self, pdf_url: Union[str, List[str]], max_pages: int = 0) -> Dict[str, Any]:
        """
        Download PDF(s) from URL(s) and extract text content.
        
        Args:
            pdf_url: A single URL string or a list of URL strings pointing to PDF documents
            max_pages: Maximum number of pages to extract per PDF (0 = all pages)
            
        Returns:
            A dictionary containing extracted text and metadata:
            {
                "success": bool,
                "documents": [
                    {
                        "url": "https://document-url.pdf",
                        "text": "Extracted text content...",
                        "page_count": 5,
                        "extracted_pages": 5,
                        "error": "Error message if any"
                    },
                    ...
                ]
            }
        """
        # Standardize input to list
        urls = pdf_url if isinstance(pdf_url, list) else [pdf_url]
        results = {"success": False, "documents": []}
        
        for url in urls:
            doc_result = {
                "url": url,
                "text": "",
                "page_count": 0,
                "extracted_pages": 0,
                "error": None
            }
            
            try:
                # Download the PDF
                response = requests.get(url, timeout=30, stream=True)
                
                # Check if the request was successful
                if response.status_code != 200:
                    doc_result["error"] = f"Failed to download PDF. Status code: {response.status_code}"
                    results["documents"].append(doc_result)
                    continue
                
                # Check if the content type is PDF
                content_type = response.headers.get('Content-Type', '')
                if 'application/pdf' not in content_type.lower() and not url.lower().endswith('.pdf'):
                    doc_result["error"] = f"The URL does not point to a PDF document. Content-Type: {content_type}"
                    results["documents"].append(doc_result)
                    continue
                
                # Create a file-like object from the response content
                pdf_file = io.BytesIO(response.content)
                
                # Try to open the PDF
                try:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    
                    # Get total page count
                    total_pages = len(pdf_reader.pages)
                    doc_result["page_count"] = total_pages
                    
                    # Determine how many pages to extract
                    pages_to_extract = total_pages
                    if max_pages > 0 and max_pages < total_pages:
                        pages_to_extract = max_pages
                    
                    # Extract text from pages
                    extracted_text = []
                    for i in range(pages_to_extract):
                        page = pdf_reader.pages[i]
                        try:
                            page_text = page.extract_text()
                            if page_text:
                                extracted_text.append(page_text)
                            doc_result["extracted_pages"] += 1
                        except Exception as e:
                            # If a page fails, continue with the next
                            pass
                    
                    # Combine extracted text
                    doc_result["text"] = "\n\n".join(extracted_text)
                    
                except PyPDF2.errors.PdfReadError as e:
                    doc_result["error"] = f"Failed to read PDF: {str(e)}"
                
            except requests.exceptions.RequestException as e:
                doc_result["error"] = f"Failed to download PDF: {str(e)}"
            except Exception as e:
                doc_result["error"] = f"An unexpected error occurred: {str(e)}"
            
            # Add this document's results to the overall results
            results["documents"].append(doc_result)
        
        # Set overall success flag if at least one document was processed successfully
        results["success"] = any(doc.get("text") and not doc.get("error") for doc in results["documents"])
        
        return results 