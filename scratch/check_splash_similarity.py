import os
from PIL import Image

assets_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets"
splash_path = os.path.join(assets_dir, "splash-icon.png")
logo_path = os.path.join(assets_dir, "images", "sabispell_logo.png")

if os.path.exists(splash_path) and os.path.exists(logo_path):
    with Image.open(splash_path) as img1, Image.open(logo_path) as img2:
        print(f"splash-icon.png: size={img1.size}, mode={img1.mode}")
        print(f"sabispell_logo.png: size={img2.size}, mode={img2.mode}")
        
        # Compare pixels
        img1_rgb = img1.convert("RGB")
        img2_rgb = img2.convert("RGB")
        
        diff = 0
        for x in range(0, 1024, 8):
            for y in range(0, 1024, 8):
                if img1_rgb.getpixel((x, y)) != img2_rgb.getpixel((x, y)):
                    diff += 1
        print("Difference count (sampled 1/64 pixels):", diff)
else:
    print("Files not found")
