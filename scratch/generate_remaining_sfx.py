import json
import time
import urllib.request
import urllib.parse
import os
import ssl

API_KEY = "1a0496b73c63b2546dc662275cd16b35"
BASE_URL = "https://api.sunoapi.org"
TARGET_DIR = r"c:\Users\hp\SabiSpell-V1\SabiSpell\assets\audio"

# Prompts for remaining sounds
PROMPTS = {
    "wrong": {
        "style": "short error buzzer sound, low digital buzzer, incorrect alert, 2 seconds",
        "title": "wrong_buzz",
        "prompt": "short error buzzer sound, low digital buzzer, incorrect alert, 2 seconds"
    },
    "celebration": {
        "style": "triumphant celebratory fanfare victory trumpet melody game success fanfare, 5 seconds",
        "title": "victory_fanfare",
        "prompt": "triumphant celebratory fanfare victory trumpet melody game success fanfare, 5 seconds"
    },
    "gangan": {
        "style": "short indigenous Yoruba talking drum roll, traditional gangan drum beat pattern, 4 seconds",
        "title": "gangan_drum",
        "prompt": "short indigenous Yoruba talking drum roll, traditional gangan drum beat pattern, 4 seconds"
    }
}

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
    task_ids = {}
    
    # 1. Trigger tasks
    print("Initiating sound generation tasks...")
    for key, info in PROMPTS.items():
        print(f"Submitting sound task for '{key}'...")
        payload = {
            "customMode": True,
            "instrumental": True,
            "callBackUrl": "https://api.example.com/callback",
            "model": "V5",
            "style": info["style"],
            "title": info["title"],
            "prompt": info["prompt"]
        }
        res = make_post_request(f"{BASE_URL}/api/v1/generate", payload)
        if res and res.get("code") == 200:
            task_id = res["data"]["taskId"]
            task_ids[key] = task_id
            print(f"Successfully submitted task for '{key}': Task ID = {task_id}")
        else:
            print(f"Failed to submit task for '{key}': {res}")
        time.sleep(1)
        
    if not task_ids:
        print("No tasks successfully started. Exiting.")
        return

    # 2. Poll tasks
    print("\nPolling tasks for completion (this can take a few minutes)...")
    pending_keys = list(task_ids.keys())
    audio_urls = {
        # Add the already generated 'correct' sound url
        "correct": "https://tempfile.aiquickdraw.com/r/ea2caffeb8304e1fa4b0c1c4a8b6581c.mp3"
    }
    
    attempts = 0
    max_attempts = 60
    
    while pending_keys and attempts < max_attempts:
        attempts += 1
        print(f"\n--- Check #{attempts} (Pending: {', '.join(pending_keys)}) ---")
        finished_keys = []
        for key in pending_keys:
            task_id = task_ids[key]
            res = make_get_request(f"{BASE_URL}/api/v1/generate/record-info?taskId={task_id}")
            if not res or res.get("code") != 200:
                print(f"Error checking details for '{key}' task {task_id}. Retrying...")
                continue
                
            status = res["data"].get("status")
            print(f"'{key}' Status: {status}")
            
            if status == "SUCCESS":
                suno_data = res["data"].get("response", {}).get("sunoData", [])
                if suno_data:
                    audio_url = suno_data[0].get("audioUrl")
                    if audio_url:
                        audio_urls[key] = audio_url
                        print(f"SUCCESS: Generated audio URL for '{key}': {audio_url}")
                    finished_keys.append(key)
                else:
                    print(f"SUCCESS status but no sunoData found for '{key}'. Retrying...")
            elif status in ["GENERATE_AUDIO_FAILED", "CREATE_TASK_FAILED", "SENSITIVE_WORD_ERROR"]:
                print(f"FAILED: Task for '{key}' failed with status {status}")
                finished_keys.append(key)
                
        for key in finished_keys:
            pending_keys.remove(key)
            
        if pending_keys:
            time.sleep(10)
            
    # 3. Download audio files
    print("\nDownloading generated audio files...")
    os.makedirs(TARGET_DIR, exist_ok=True)
    
    filename_map = {
        "correct": "streak_pop.mp3",
        "wrong": "wrong_wazobia.mp3",
        "celebration": "graduation_fanfare.mp3",
        "gangan": "gangan_correct.mp3"
    }
    
    for key, url in audio_urls.items():
        filename = filename_map[key]
        dest_path = os.path.join(TARGET_DIR, filename)
        print(f"Downloading '{key}' from {url} to {dest_path}...")
        try:
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            )
            with urllib.request.urlopen(req, context=ssl_context) as response, open(dest_path, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Successfully downloaded and saved {filename}")
        except Exception as e:
            print(f"Failed to download audio for '{key}': {e}")
            
    print("\nDone!")

if __name__ == "__main__":
    main()
