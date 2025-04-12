@echo off
cd python-adk-backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing dependencies...
pip install -r requirements.txt
echo Starting Python ADK backend...
set PORT=5001
python app.py 