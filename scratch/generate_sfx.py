import json
import time
import urllib.request
import urllib.parse
import os
import ssl

API_KEY = "1a0496b73c63b2546dc662275cd16b35"
BASE_URL = "https://api.sunoapi.org"
TARGET_DIR = r"c:\Users\hp\SabiSpell-V1\SabiSpell\assets\audio"

PROMPTS = {
    "correct": "short clean interface sound effect pop ding bubble for correct answer, bright digital, high quality, 1 second",
    "wrong": "short low-pitched digital buzzer game sound effect for wrong answer, error sound, soft alert, 1 second",
    "celebration": "triumphant celebratory fanfare success trumpet melody game victory sound effect, high quality, 3 seconds",
    "gangan": "short authentic traditional Yoruba talking drum beat sound effect, roll, indigenous Nigerian gangan drum pattern, 2 seconds"
}

# Create unverified SSL context to bypass local Schannel revocation check issues
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
    # Remove Content-Type for GET request
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
    for key, prompt in PROMPTS.items():
        print(f"Submitting sound task for '{key}'...")
        payload = {
            "prompt": prompt,
            "model": "V5",
            "soundLoop": False
        }
        res = make_post_request(f"{BASE_URL}/api/v1/generate/sounds", payload)
        if res and res.get("code") == 200:
            task_id = res["data"]["taskId"]
            task_ids[key] = task_id
            print(f"Successfully submitted task for '{key}': Task ID = {task_id}")
        else:
            print(f"Failed to submit task for '{key}': {res}")
        time.sleep(1) # Rate limit friendly
        
    if not task_ids:
        print("No tasks successfully started. Exiting.")
        return

    # 2. Poll tasks
    print("\nPolling tasks for completion (this can take a few minutes)...")
    pending_keys = list(task_ids.keys())
    audio_urls = {}
    
    attempts = 0
    max_attempts = 60 # 5 minutes max
    
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
            time.sleep(10) # Wait 10 seconds between checks
            
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
            # Download with unverified context as well
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
