import os
from PIL import Image
import collections

res_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\android\app\src\main\res"
path = os.path.join(res_dir, "drawable-xxxhdpi", "splashscreen_logo.png")

if os.path.exists(path):
    with Image.open(path) as img:
        print(f"splashscreen_logo.png: format={img.format}, size={img.size}, mode={img.mode}")
        datas = img.getdata()
        transparent = 0
        non_transparent = 0
        color_counts = collections.Counter()
        for item in datas:
            if len(item) == 4:
                r, g, b, a = item
                if a > 10:
                    non_transparent += 1
                    color_counts[(r, g, b)] += 1
                else:
                    transparent += 1
            else:
                non_transparent += 1
        print(f"Transparent pixels: {transparent}, Non-transparent pixels: {non_transparent}")
        print("Top 5 non-transparent colors:")
        for c, count in color_counts.most_common(5):
            print(f"  Color: {c}, Count: {count}")
else:
    print("File not found:", path)
