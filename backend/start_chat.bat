@echo off
echo Starting Python Socket.io Server for Student-Instructor Chat...
python "%~dp0start_chat_server.py" %*
pause
