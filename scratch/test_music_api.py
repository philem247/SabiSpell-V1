import json
import urllib.request
import ssl

API_KEY = "1a0496b73c63b2546dc662275cd16b35"
BASE_URL = "https://api.sunoapi.org"
ssl_context = ssl._create_unverified_context()

def main():
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    payload = {
        "customMode": True,
        "instrumental": True,
        "callBackUrl": "https://api.example.com/callback",
        "model": "V5",
        "style": "short game select chime, positive bright ding pop, 2 seconds",
        "title": "correct_ding",
        "prompt": "short game select chime, positive bright ding pop, 2 seconds"
    }
    
    req = urllib.request.Request(
        f"{BASE_URL}/api/v1/generate", 
        data=json.dumps(payload).encode("utf-8"), 
        headers=headers, 
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, context=ssl_context) as res:
            response_data = json.loads(res.read().decode("utf-8"))
            print("Response:", json.dumps(response_data, indent=2))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
