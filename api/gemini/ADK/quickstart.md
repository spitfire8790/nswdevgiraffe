## Quickstart

This quickstart guides you through installing the Agent Development Kit (ADK), setting up a basic agent with multiple tools, and running it locally either in the terminal or in the interactive, browser-based dev UI.

This quickstart assumes a local IDE (VS Code, PyCharm, etc.) with Python 3.9+ and terminal access. This method runs the application entirely on your machine and is recommended for internal development.

### 1. Setup Environment & Install ADK

Create & Activate Virtual Environment (Recommended):

``` python
# Create
python -m venv .venv
# Activate (each new terminal)
# macOS/Linux: source .venv/bin/activate
# Windows CMD: .venv\Scripts\activate.bat
# Windows PowerShell: .venv\Scripts\Activate.ps1
```

Install ADK

pip install google-adk

### 2. Create Agent Project

Project Structure

ou will need to create the following project structure:

```
parent_folder/
    multi_tool_agent/
        __init__.py
        agent.py
        .env
```

Create the folder multi_tool_agent:

``` python
mkdir multi_tool_agent/
__init__.py
```

Now create an __init__.py file in the folder:

```python
echo "from . import agent" > multi_tool_agent/__init__.py
```

Your __init__.py should now look like this:

```python
multi_tool_agent/__init__.py

from . import agent
```

agent.py

Create an agent.py file in the same folder:

```
touch multi_tool_agent/agent.py
```

Copy and paste the following code into agent.py:

```python
multi_tool_agent/agent.py

import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent

def get_weather(city: str) -> dict:
    """Retrieves the current weather report for a specified city.

    Args:
        city (str): The name of the city for which to retrieve the weather report.

    Returns:
        dict: status and result or error msg.
    """
    if city.lower() == "new york":
        return {
            "status": "success",
            "report": (
                "The weather in New York is sunny with a temperature of 25 degrees"
                " Celsius (41 degrees Fahrenheit)."
            ),
        }
    else:
        return {
            "status": "error",
            "error_message": f"Weather information for '{city}' is not available.",
        }


def get_current_time(city: str) -> dict:
    """Returns the current time in a specified city.

    Args:
        city (str): The name of the city for which to retrieve the current time.

    Returns:
        dict: status and result or error msg.
    """

    if city.lower() == "new york":
        tz_identifier = "America/New_York"
    else:
        return {
            "status": "error",
            "error_message": (
                f"Sorry, I don't have timezone information for {city}."
            ),
        }

    tz = ZoneInfo(tz_identifier)
    now = datetime.datetime.now(tz)
    report = (
        f'The current time in {city} is {now.strftime("%Y-%m-%d %H:%M:%S %Z%z")}'
    )
    return {"status": "success", "report": report}


root_agent = Agent(
    name="weather_time_agent",
    model="gemini-2.0-flash-exp",
    description=(
        "Agent to answer questions about the time and weather in a city."
    ),
    instruction=(
        "I can answer your questions about the time and weather in a city."
    ),
    tools=[get_weather, get_current_time],
)
```

.env

Create a .env file in the same folder:

```touch multi_tool_agent/.env
```

You can just copy and paste the following code for now, as more instructions are describe in the next section on Setup the model.
```
multi_tool_agent/.env
```

### If using Gemini via Google AI Studio
GOOGLE_GENAI_USE_VERTEXAI="False"
GOOGLE_API_KEY="paste-your-actual-key-here"

### If using Gemini via Vertex AI on Google CLoud
### GOOGLE_CLOUD_PROJECT="your-project-id"
### GOOGLE_CLOUD_LOCATION="your-location" #e.g. us-central1
### GOOGLE_GENAI_USE_VERTEXAI="True"

