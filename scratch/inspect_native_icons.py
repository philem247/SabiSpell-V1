import os
from PIL import Image

res_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\android\app\src\main\res"

for root, dirs, files in os.walk(res_dir):
    for f in files:
        if f.endswith(".png") and ("ic_launcher" in f or "splash" in f):
            path = os.path.join(root, f)
            rel_path = os.path.relpath(path, res_dir)
            with Image.open(path) as img:
                print(f"{rel_path}: size={img.size}, mode={img.mode}")
