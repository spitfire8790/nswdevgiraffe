# Property Information Agent with Google ADK

This project implements a multi-agent system using Google's Agent Development Kit (ADK) to research property information. It consists of a Python backend with a coordinator agent architecture that orchestrates specialized sub-agents.

## Architecture

The system follows the Coordinator-Agent pattern as recommended in the ADK documentation:

1. **Coordinator Agent**: Orchestrates the workflow and delegates tasks to specialized sub-agents
2. **Search Agent**: Uses Google Search to find property information online
3. **Document Analysis Agent**: Analyzes PDF documents from council websites

Custom tools have been implemented for:

- Web browsing (using requests and BeautifulSoup)
- Council website scraping (specifically for Ryde Council)
- PDF document extraction and analysis

## Setup and Installation

1. Clone the repository
2. Install dependencies:

```
pip install google-adk flask flask-cors python-dotenv PyPDF2 beautifulsoup4 requests
```

3. Create a `.env` file in the root directory with your Gemini API key:

```
GEMINI_API_KEY=your-api-key-here
```

## Running the Application

Start the Flask server:

```
python app.py
```

The server will run on port 5001 by default. You can test it with:

```
curl http://localhost:5001/api/agent/health
```

## API Endpoints

- **GET /api/agent/health**: Health check endpoint
- **POST /api/agent/generate**: Main endpoint for generating responses
  - Input format:
  ```json
  {
    "prompt": "Your query about a property",
    "history": [] // Optional conversation history
  }
  ```
  - Output format:
  ```json
  {
    "success": true,
    "text": "Generated response",
    "sources": [] // Sources used for the response
  }
  ```

## Testing

You can test the coordinator agent setup with:

```
python test_coordinator.py
```
