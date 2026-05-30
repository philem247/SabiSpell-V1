from PIL import Image
import os

assets_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets"
files = [
    "icon.png",
    "splash-icon.png",
    "android-icon-foreground.png",
    "android-icon-background.png",
    "android-icon-monochrome.png"
]

for f in files:
    path = os.path.join(assets_dir, f)
    if os.path.exists(path):
        with Image.open(path) as img:
            print(f"{f}: format={img.format}, size={img.size}, mode={img.mode}")
            # check colors briefly
            colors = img.getcolors(maxcolors=256)
            if colors:
                print(f"  Unique colors (<256): {len(colors)}")
            else:
                print("  Unique colors: >256")
    else:
        print(f"{f} not found")
