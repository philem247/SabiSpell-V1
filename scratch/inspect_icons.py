import os
from PIL import Image

assets_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets"
files = [
    "icon.png",
    "android-icon-foreground.png",
    "android-icon-background.png",
    "images/sabispell_logo.png"
]

for f in files:
    path = os.path.join(assets_dir, f)
    if os.path.exists(path):
        with Image.open(path) as img:
            print(f"{f}: format={img.format}, size={img.size}, mode={img.mode}")
    else:
        print(f"{f} not found at {path}")
