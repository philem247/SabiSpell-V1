from PIL import Image
import collections

path = r"C:\Users\hp\SabiSpell-V1\SabiSpell\assets\android-icon-foreground.png"
with Image.open(path) as img:
    colors = img.getcolors(maxcolors=10000)
    print("Number of unique colors in foreground icon:", len(colors) if colors else "More than 10000")
    
    # Count pixels that are not fully transparent
    datas = img.getdata()
    non_transparent = 0
    transparent = 0
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
