import os
from PIL import Image

path = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets\images\sabispell_logo.png"
with Image.open(path) as img:
    pixels = img.load()
    print("sabispell_logo.png top-left pixel:", pixels[0, 0])
    print("sabispell_logo.png center pixel:", pixels[512, 512])

path2 = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets\android-icon-foreground.png"
if os.path.exists(path2):
    with Image.open(path2) as img:
        pixels2 = img.load()
        print("android-icon-foreground.png top-left pixel:", pixels2[0, 0])
        print("android-icon-foreground.png center pixel:", pixels2[256, 256])
