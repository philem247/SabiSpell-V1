import os
import zipfile

target_class = "LazyKType"
node_modules_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\node_modules"

found_files = []

for root, dirs, files in os.walk(node_modules_dir):
    for file in files:
        if file.endswith((".jar", ".aar")):
            path = os.path.join(root, file)
            try:
                with zipfile.ZipFile(path, "r") as z:
                    for name in z.namelist():
                        if target_class in name:
                            found_files.append((path, name))
            except Exception as e:
                # Some files might be locked or invalid zip files
                pass

if found_files:
    print(f"Found class '{target_class}' in:")
    for path, name in found_files:
        rel_path = os.path.relpath(path, node_modules_dir)
        print(f"  {rel_path} -> {name}")
else:
    print(f"Class '{target_class}' NOT found in any .jar or .aar files in node_modules!")
