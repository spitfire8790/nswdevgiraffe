"""
Main Flask application for the Property Information Agent backend.
This server exposes API endpoints for running the multi-agent system with Google ADK.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import re
from google.adk.runners import InMemoryRunner
from google.adk.agents import Agent
import uuid

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API key from environment variable
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set")

@app.route('/api/agent/generate', methods=['POST'])
def generate_response():
    """
    Generate a response using the ADK agent.
    
    Expects a JSON request with:
    - prompt: The user's query and context
    - history: (Optional) Conversation history
    
    Returns a JSON response with:
    - success: Boolean indicating success/failure
    - text: Generated text response
    - sources: Sources of information used
    """
    try:
        # Get request data
        data = request.json
        prompt = data.get('prompt')
        history = data.get('history', [])
        
        if not prompt:
            return jsonify({
                'success': False,
                'text': 'Prompt is required',
                'error': 'No prompt provided'
            }), 400
        
        # Log the incoming request (truncated for brevity)
        print(f"=== INCOMING REQUEST ===")
        print(f"Prompt preview: {prompt[:150]}...")
        print(f"History items: {len(history)}")
        
        # Create a single agent (simpler approach)
        agent = Agent(
            name="property_assistant",
            model="gemini-1.5-flash",
            instruction="""
            You are a property information assistant that provides details about properties and development applications.
            
            When analyzing property information, focus on:
            - Environmental factors (flooding, bushfire, contamination)
            - Zoning and planning information
            - Community feedback or objections
            - Infrastructure and services
            - Historical significance
            
            For each finding, indicate if it represents a positive, neutral, or negative factor.
            ALWAYS cite your sources with the exact URL or document name where you found the information.
            """,
            description="An assistant that provides property information.",
            tools=[]  # No tools for simplicity
        )
        
        # Generate unique user and session IDs
        user_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        
        # Create runner with the agent
        runner = InMemoryRunner(app_name="PropertyInfoAgent", agent=agent)
        
        # Collect all events
        response_events = []
        print(f"Starting agent run with user_id={user_id}, session_id={session_id}")
        try:
            for event in runner.run(user_id=user_id, session_id=session_id, new_message=prompt):
                print(f"Received event: {event}")
                response_events.append(event)
            print(f"Collected {len(response_events)} events")
        except Exception as e:
            print(f"Error during agent run: {str(e)}")
            raise
        
        # Default response if no events were generated
        result_text = "I'm sorry, I couldn't generate a response. Please try again."
        
        # Process events to extract the response text
        if response_events:
            for event in response_events:
                if hasattr(event, 'parts') and event.parts:
                    for part in event.parts:
                        if hasattr(part, 'text') and part.text:
                            result_text = part.text
                            break
        
        # Extract sources (for now, a placeholder as we need to extract from the events)
        sources = []
        
        # Log the response (truncated for brevity)
        print(f"=== GENERATED RESPONSE ===")
        print(f"Response preview: {result_text[:150] if isinstance(result_text, str) else 'No text'}...")
        print(f"Sources: {len(sources)}")
        
        return jsonify({
            'success': True,
            'text': result_text,
            'sources': sources
        })
        
    except Exception as e:
        # Log the error
        print(f"ERROR: {str(e)}")
        # Return error response
        return jsonify({
            'success': False,
            'text': f"Sorry, there was an error processing your request: {str(e)}",
            'error': str(e)
        }), 500

@app.route('/api/agent/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'Agent API is running'
    })

if __name__ == '__main__':
    # Create a .env file in the root directory
    if not os.path.exists('.env'):
        with open('.env', 'w') as f:
            f.write("GEMINI_API_KEY=your-api-key-here\n")
        print("Created .env file. Please edit it to add your Gemini API key.")
    
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port) 