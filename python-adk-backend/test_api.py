"""
Test script to verify the /api/agent/generate endpoint
"""

import requests
import json

def test_generate_endpoint():
    url = "http://localhost:5001/api/agent/generate"
    
    # Test data
    data = {
        "prompt": "Tell me about 1-5 KHARTOUM ROAD MACQUARIE PARK 2113",
        "history": []
    }
    
    # Make the POST request
    try:
        print("Sending request to:", url)
        print("Request data:", json.dumps(data, indent=2))
        
        response = requests.post(
            url, 
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print("\nResponse status code:", response.status_code)
        
        # Print the response content
        try:
            response_data = response.json()
            print("Response data:", json.dumps(response_data, indent=2))
        except json.JSONDecodeError:
            print("Raw response text:", response.text)
            
    except Exception as e:
        print("Error during request:", str(e))

if __name__ == "__main__":
    test_generate_endpoint() 