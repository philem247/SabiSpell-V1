import json
import time
import urllib.request
import urllib.parse
import os
import ssl

API_KEY = "1a0496b73c63b2546dc662275cd16b35"
BASE_URL = "https://api.sunoapi.org"
TARGET_DIR = r"c:\Users\hp\SabiSpell-V1\SabiSpell\assets\audio"

ssl_context = ssl._create_unverified_context()

def get_headers():
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

def make_post_request(url, data):
    headers = get_headers()
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, context=ssl_context) as res:
            return json.loads(res.read().decode("utf-8"))
    except Exception as e:
        print(f"Error making POST request to {url}: {e}")
        return None

def make_get_request(url):
    headers = get_headers()
    headers.pop("Content-Type", None)
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, context=ssl_context) as res:
            return json.loads(res.read().decode("utf-8"))
    except Exception as e:
        print(f"Error making GET request to {url}: {e}")
        return None

def main():
    print("Initiating background music generation task...")
    payload = {
        "customMode": True,
        "instrumental": True,
        "callBackUrl": "https://api.example.com/callback",
        "model": "V5",
        "style": "upbeat West African Yoruba talking drum instrumental, traditional Nigerian percussion groove, playful, educational mobile game atmosphere, 120 bpm",
        "title": "bg_music",
        "prompt": "upbeat West African Yoruba talking drum instrumental background music loop, traditional Nigerian percussion groove, playful, educational mobile game atmosphere, 120 bpm, loopable, high quality"
    }
    
    res = make_post_request(f"{BASE_URL}/api/v1/generate", payload)
    if not res or res.get("code") != 200:
        print(f"Failed to submit BGM task: {res}")
        return
        
    task_id = res["data"]["taskId"]
    print(f"Successfully submitted BGM task: Task ID = {task_id}")

    # Poll task status
    print("\nPolling BGM task for completion...")
    attempts = 0
    max_attempts = 60
    audio_url = None
    
    while attempts < max_attempts:
        attempts += 1
        print(f"Check #{attempts}...")
        res = make_get_request(f"{BASE_URL}/api/v1/generate/record-info?taskId={task_id}")
        if not res or res.get("code") != 200:
            print("Error checking task details. Retrying...")
            time.sleep(10)
            continue
            
        status = res["data"].get("status")
        print(f"Status: {status}")
        
        if status == "SUCCESS":
            suno_data = res["data"].get("response", {}).get("sunoData", [])
            if suno_data:
                audio_url = suno_data[0].get("audioUrl")
                print(f"SUCCESS: Generated BGM audio URL: {audio_url}")
                break
            else:
                print("SUCCESS status but no sunoData found. Retrying...")
        elif status in ["GENERATE_AUDIO_FAILED", "CREATE_TASK_FAILED", "SENSITIVE_WORD_ERROR"]:
            print(f"FAILED: Task failed with status {status}")
            break
            
        time.sleep(10)

    if not audio_url:
        print("Failed to obtain BGM audio URL. Exiting.")
        return

    # Download BGM file
    os.makedirs(TARGET_DIR, exist_ok=True)
    dest_path = os.path.join(TARGET_DIR, "bg_music.mp3")
    print(f"\nDownloading BGM from {audio_url} to {dest_path}...")
    try:
        req = urllib.request.Request(
            audio_url, 
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        )
        with urllib.request.urlopen(req, context=ssl_context) as response, open(dest_path, 'wb') as out_file:
            out_file.write(response.read())
        print("Successfully downloaded and saved bg_music.mp3")
    except Exception as e:
        print(f"Failed to download BGM: {e}")

if __name__ == "__main__":
    main()
