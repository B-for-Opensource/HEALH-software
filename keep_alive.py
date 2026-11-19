import time
import urllib.request
import json
from datetime import datetime

URL = "https://healh-software.onrender.com/health"
INTERVAL_SECONDS = 120  # 2 minutes

def ping():
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "HEAL-KeepAlive/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            body = response.read().decode("utf-8")
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] PING {URL} -> {status_code}: {body}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] PING ERROR: {e}")

if __name__ == "__main__":
    print(f"Starting keep-alive pinger for {URL} every {INTERVAL_SECONDS} seconds...")
    while True:
        ping()
        time.sleep(INTERVAL_SECONDS)
