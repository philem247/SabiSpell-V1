import os

target = "VideoViewModule.kt"
node_modules_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\node_modules\expo-av"

for root, dirs, files in os.walk(node_modules_dir):
    if target in files:
        print("Found file at:", os.path.join(root, target))
