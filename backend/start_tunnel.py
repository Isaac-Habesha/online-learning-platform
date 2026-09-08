"""
Ngrok Tunnel & Chapa Webhook Assistant
Starts ngrok on port 8000, grabs the public HTTPS URL,
updates BACKEND_URL in backend/.env, and outputs the Chapa webhook endpoint.
"""

import os
import sys
import time
import re
import json
import shutil
import subprocess
import urllib.request
import urllib.error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
NGROK_API = "http://127.0.0.1:4040/api/tunnels"
DEFAULT_PORT = 8000


def find_ngrok():
    ngrok_bin = shutil.which("ngrok")
    if ngrok_bin:
        return ngrok_bin
    
    # Check default download paths
    candidate = os.path.join(os.path.expanduser("~"), "Downloads", "ngrok.exe")
    if os.path.exists(candidate):
        return candidate
        
    return None


def update_env_backend_url(public_url):
    if not os.path.exists(ENV_PATH):
        print(f"[!] Warning: .env file not found at {ENV_PATH}")
        return False

    with open(ENV_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if re.search(r"^BACKEND_URL=.*$", content, flags=re.MULTILINE):
        new_content = re.sub(
            r"^BACKEND_URL=.*$",
            f"BACKEND_URL={public_url}",
            content,
            flags=re.MULTILINE,
        )
    else:
        new_content = content.rstrip() + f"\nBACKEND_URL={public_url}\n"

    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    return True


def get_public_url(timeout=20):
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(NGROK_API, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                tunnels = data.get("tunnels", [])
                for t in tunnels:
                    url = t.get("public_url", "")
                    if url.startswith("https://"):
                        return url
        except Exception:
            pass
        time.sleep(1)
    return None


def main():
    port = DEFAULT_PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    ngrok_cmd = find_ngrok()
    if not ngrok_cmd:
        print("[X] ngrok executable not found in PATH or Downloads.")
        print("    Download ngrok from https://ngrok.com/download and place it in your PATH.")
        sys.exit(1)

    print("=" * 60)
    print("   ONLINE LEARNING PLATFORM - NGROK & CHAPA WEBHOOK RUNNER")
    print("=" * 60)
    print(f"[*] Found ngrok binary: {ngrok_cmd}")
    print(f"[*] Starting ngrok tunnel targeting local port {port}...")

    # Start ngrok process
    try:
        proc = subprocess.Popen(
            [ngrok_cmd, "http", str(port), "--log=stdout"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except Exception as e:
        print(f"[X] Failed to launch ngrok: {e}")
        sys.exit(1)

    # Wait for API to respond and get public URL
    print("[*] Acquiring public tunnel URL from ngrok...")
    public_url = get_public_url(timeout=15)

    if not public_url:
        # Check if process died or threw authtoken error
        time.sleep(1)
        if proc.poll() is not None:
            stdout, _ = proc.communicate(timeout=2)
            print("\n[X] ngrok process exited with error:")
            print("-" * 50)
            print(stdout)
            print("-" * 50)
            if "ERR_NGROK_4018" in stdout or "authentication failed" in stdout:
                print("\n[!] NGROK AUTHTOKEN REQUIRED:")
                print("    1. Sign up for a free account at: https://dashboard.ngrok.com/signup")
                print("    2. Copy your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken")
                print("    3. Run in your terminal:")
                print("       ngrok config add-authtoken <YOUR_TOKEN>\n")
            sys.exit(1)
        else:
            print("[!] Could not retrieve public URL from ngrok web API.")
            proc.terminate()
            sys.exit(1)

    webhook_url = f"{public_url}/api/payments/webhook/"
    print("\n" + "=" * 60)
    print(f"[+] TUNNEL ACTIVE:")
    print(f"    Public URL:      {public_url}")
    print(f"    Targeting:       http://localhost:{port}")
    print(f"    Chapa Webhook:   {webhook_url}")
    print("=" * 60)

    # Update backend/.env
    if update_env_backend_url(public_url):
        print(f"[+] Updated BACKEND_URL in backend/.env -> {public_url}")
    else:
        print(f"[!] Please manually set BACKEND_URL={public_url} in backend/.env")

    print("\n[*] Ready for Chapa testing!")
    print(f"    Callback/Webhook URL to register in Chapa: {webhook_url}")
    print("    Press Ctrl+C to stop tunnel...\n")

    try:
        proc.wait()
    except KeyboardInterrupt:
        print("\n[*] Shutting down ngrok tunnel...")
        proc.terminate()
        proc.wait()
        print("[*] Tunnel closed.")


if __name__ == "__main__":
    main()
