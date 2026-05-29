import os
from PIL import Image

logo_path = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets\images\sabispell_logo.png"
output_path = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets\android-icon-foreground.png"

# Load the logo and convert to RGBA
img = Image.open(logo_path).convert("RGBA")
width, height = img.size

# The background color is at (0,0)
bg_color = img.getpixel((0, 0))
print("Background color to remove:", bg_color)

# Create new image data
datas = img.getdata()
new_data = []
tolerance = 25

for item in datas:
    # Calculate color distance in 3D RGB space
    dist = sum((a - b) ** 2 for a, b in zip(item[:3], bg_color[:3])) ** 0.5
    if dist < tolerance:
        # Set pixel to fully transparent
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Resize to 512x512 for Android adaptive icon foreground
resized_img = img.resize((512, 512), Image.Resampling.LANCZOS)
resized_img.save(output_path, "PNG")

print("Created transparent adaptive icon foreground at:", output_path)
