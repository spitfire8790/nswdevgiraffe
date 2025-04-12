# Plan: Integrating Google Agent Development Kit (ADK) with Multi-Agent System

**Goal:** Implement a multi-agent system using Google's ADK in a Python backend. This system will handle property information requests by:

1.  Performing general web searches using a dedicated **Search Agent**.
2.  Fetching, parsing, and analyzing attached PDF documents from council websites (specifically Ryde initially) using a dedicated **Document Analysis Agent**, triggered when a `CouncilReference` is available.
    This replaces direct Gemini API calls while retaining the existing React chat interface.

**Architecture:**

1.  **Python ADK Backend (Flask/FastAPI):**
    - Hosts the ADK multi-agent system.
    - Receives requests from the frontend.
    - Orchestrates the Search Agent and Document Analysis Agent.
    - Requires custom ADK tools for web scraping council sites and PDF parsing.
2.  **JavaScript Frontend (React):**
    - Existing `ChatInterface` remains the UI.
    - `queryBuilder.js` ensures the `CouncilReference` (and potentially LGA) is included in the context/prompt sent to the backend.
    - `geminiService.js` calls the Python ADK backend endpoint.

**Implementation Steps:**

**Phase 1: Setup Python ADK Backend & Core Components**

1.  **Create Project Directory & Dependencies:** (As before) `python-adk-backend`, virtual environment, `pip install google-adk flask python-dotenv flask-cors beautifulsoup4 requests PyPDF2` (adding scraping/PDF libraries).
2.  **Develop Flask Server (`app.py`):**
    - Setup Flask app, CORS, environment variables.
    - Define `/api/agent/generate` POST endpoint.
3.  **Implement Custom Tools:**
    - **`CouncilWebGridScraper` Tool:**
      - Create a custom ADK tool (`tools/council_scraper.py`).
      - Input: `council_reference`, `lga` (e.g., "RYDE").
      - Logic:
        - Construct the specific council URL (e.g., Ryde KapishWebGrid URL).
        - Use `requests` and `BeautifulSoup4` (or potentially a headless browser like Playwright/Selenium if the site is heavily JS-driven) to fetch the page content.
        - Parse the HTML to find hyperlinks (`<a>` tags) pointing to PDF documents related to the `council_reference`. Handle potential errors (site structure changes, reference not found).
        - Output: A list of PDF URLs.
    - **`PdfTextExtractor` Tool:**
      - Create a custom ADK tool (`tools/pdf_extractor.py`).
      - Input: `pdf_url` (or potentially a list of URLs).
      - Logic:
        - Use `requests` to download the PDF content in memory.
        - Use `PyPDF2` (or `pdfplumber`) to extract text content from the PDF. Handle encrypted PDFs or extraction errors.
        - Output: Extracted text content (potentially concatenated or structured per PDF).
4.  **Initialize Tool Registry:**
    - In `app.py`, create a `ToolRegistry`.
    - Register built-in tools: `GoogleSearch`, `WebBrowser`.
    - Register custom tools: `CouncilWebGridScraper`, `PdfTextExtractor`.

**Phase 2: Define ADK Agents**

1.  **Search Agent (`agents/search_agent.py`):**
    - Define an `LlmAgent`.
    - Name: `GoogleSearchAgent`.
    - Tools: Primarily `GoogleSearch`.
    - Description: "Performs Google searches based on property address, development details, and user queries to find relevant public information."
    - Prompting: Instruct it to use the search terms provided in the input prompt (which `queryBuilder.js` already prepares).
2.  **Document Analysis Agent (`agents/document_agent.py`):**
    - Define an `LlmAgent`.
    - Name: `DocumentAnalysisAgent`.
    - Tools: Primarily uses the _output_ from the custom tools (`CouncilWebGridScraper`, `PdfTextExtractor`) as context, perhaps `WebBrowser` if needed to clarify things found in PDFs.
    - Description: "Analyzes the text content extracted from council development application PDF documents to identify key information, potential issues (environmental, planning, community feedback), and summarise findings."
    - Prompting: Instruct it to analyze the provided PDF text, focusing on the standard categories (Environmental, Planning, etc.) and referencing the source document type if possible.
3.  **Orchestrator Agent (Optional but Recommended) (`agents/orchestrator.py` or logic in `app.py`):**
    - Could be a `SequentialAgent` if the flow is fixed (e.g., Search always runs, Document Analysis runs if `CouncilReference` exists).
    - Could be a coordinator `LlmAgent` that decides which agent(s) to run based on the input prompt and available data.
    - For simplicity, start with conditional logic in the `app.py` endpoint:
      - Always invoke the `Search Agent`.
      - If `CouncilReference` for "RYDE" is present in the input prompt:
        - Invoke `CouncilWebGridScraper` tool.
        - If PDF URLs are found, invoke `PdfTextExtractor` tool for each URL.
        - Invoke `Document Analysis Agent` with the extracted text.
      - Combine results from the Search Agent and (if run) the Document Analysis Agent into a final response.

**Phase 3: Update JavaScript Frontend**

1.  **Modify `queryBuilder.js`:**
    - Ensure the `buildQuery` function consistently includes the `daData.CouncilReference` and `daData.LGA` in the structured prompt/context sent to the backend. Make it clear these are specific identifiers.
2.  **Modify `geminiService.js`:**
    - Update the `fetch` call URL to point to the Python backend endpoint (`http://localhost:5000/api/agent/generate`).
    - Adjust response handling to potentially display information derived from PDFs alongside web search results, maybe indicating the source (web vs. document). Handle the `sources` field appropriately.

**Phase 4: Deployment and Testing**

1.  **Run Backend & Configure Frontend:** (As before).
2.  **Testing:**
    - **Tool Tests:** Test the custom tools (`CouncilWebGridScraper`, `PdfTextExtractor`) individually with known Ryde `CouncilReference` values and PDF links.
    - **Agent Tests:** Test the Search Agent and Document Analysis Agent in isolation via `run_agent`.
    - **End-to-End Test:**
      - Use the chat interface with a DA that _has_ a Ryde `CouncilReference`. Verify that the response includes information seemingly derived from council documents (and ideally cites them).
      - Use the chat interface with a DA that _doesn't_ have a Ryde `CouncilReference` or is from a different LGA. Verify it falls back gracefully to just the Search Agent results.
      - Check logs for errors during scraping, PDF parsing, or agent execution.

**Considerations:**

- **Web Scraping Fragility:** The `CouncilWebGridScraper` is highly dependent on the Ryde website's structure. Changes to the website will break the tool. Consider error handling and potential maintenance. Using official APIs, if available, is always preferable but often not an option for council data.
- **PDF Complexity:** PDFs can be complex (scanned images, complex layouts, password-protected). `PyPDF2` might not handle all cases. `pdfplumber` is often more robust. Error handling during extraction is crucial.
- **Performance:** Web scraping and PDF processing can be slow. Consider asynchronous execution for the Document Analysis part if it impacts user experience. The ADK might have patterns for this, or use Python's `asyncio` within the Flask endpoint/custom tools.
- **Scalability & Security:** (As before).
- **State Management:** (As before - likely needed if analysis involves multiple steps or user interaction based on document findings).
