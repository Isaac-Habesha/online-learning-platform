@echo off
echo Starting Ngrok Tunnel for Chapa Payment Webhooks...
python "%~dp0start_tunnel.py" %*
pause
