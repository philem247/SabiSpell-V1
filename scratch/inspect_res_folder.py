import os

res_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\android\app\src\main\res"

for root, dirs, files in os.walk(res_dir):
    for f in files:
        path = os.path.join(root, f)
        rel_path = os.path.relpath(path, res_dir)
        print(rel_path)
