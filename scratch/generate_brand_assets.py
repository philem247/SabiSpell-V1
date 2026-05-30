import os
from PIL import Image, ImageOps

logo_path = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets\images\sabispell_logo.png"
assets_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets"

def make_transparent_logo(img_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    new_data = []
    # The background color is white (255, 255, 255)
    for item in datas:
        r, g, b, a = item
        # If the pixel is very close to white, make it transparent
        if r > 240 and g > 240 and b > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # Auto-crop to bounding box of non-transparent pixels to get only the logo content
    bbox = img.getbbox()
    if bbox:
        img_cropped = img.crop(bbox)
        return img_cropped
    return img

print("Processing SabiSpell logo...")
cropped_logo = make_transparent_logo(logo_path)
print(f"Cropped logo size: {cropped_logo.size}")

# 1. Generate assets/icon.png (1024x1024, solid #141F25 background, logo centered)
icon_bg = Image.new("RGBA", (1024, 1024), (20, 31, 37, 255)) # #141F25
# Resize cropped logo to fit nicely (e.g. max dimension 600px)
w, h = cropped_logo.size
max_dim = 600
scale = min(max_dim / w, max_dim / h)
new_w, new_h = int(w * scale), int(h * scale)
logo_resized = cropped_logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
# Center it
offset = ((1024 - new_w) // 2, (1024 - new_h) // 2)
icon_bg.paste(logo_resized, offset, logo_resized)
icon_bg.convert("RGB").save(os.path.join(assets_dir, "icon.png"), "PNG")
print("Saved assets/icon.png")

# 2. Generate assets/splash-icon.png (1024x1024, transparent background, logo centered)
splash_bg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
# Resize cropped logo to fit nicely (e.g. max dimension 480px)
max_dim_splash = 480
scale_splash = min(max_dim_splash / w, max_dim_splash / h)
new_w_splash, new_h_splash = int(w * scale_splash), int(h * scale_splash)
logo_resized_splash = cropped_logo.resize((new_w_splash, new_h_splash), Image.Resampling.LANCZOS)
# Center it
offset_splash = ((1024 - new_w_splash) // 2, (1024 - new_h_splash) // 2)
splash_bg.paste(logo_resized_splash, offset_splash, logo_resized_splash)
splash_bg.save(os.path.join(assets_dir, "splash-icon.png"), "PNG")
print("Saved assets/splash-icon.png")

# 3. Generate assets/android-icon-foreground.png (512x512, transparent background, logo centered inside safe area)
# Safe zone for adaptive icon is 66% of the size (about 340px)
fore_bg = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
max_dim_fore = 320
scale_fore = min(max_dim_fore / w, max_dim_fore / h)
new_w_fore, new_h_fore = int(w * scale_fore), int(h * scale_fore)
logo_resized_fore = cropped_logo.resize((new_w_fore, new_h_fore), Image.Resampling.LANCZOS)
# Center it
offset_fore = ((512 - new_w_fore) // 2, (512 - new_h_fore) // 2)
fore_bg.paste(logo_resized_fore, offset_fore, logo_resized_fore)
fore_bg.save(os.path.join(assets_dir, "android-icon-foreground.png"), "PNG")
print("Saved assets/android-icon-foreground.png")

print("All custom branding assets generated successfully!")
