import json

lockfile_path = r"C:\Users\hp\SabiSpell-V1\SabiSpell\package-lock.json"

with open(lockfile_path, "r", encoding="utf-8") as f:
    data = json.load(f)

packages = data.get("packages", {})

found = {}
for name, info in packages.items():
    if "expo-modules-core" in name:
        found[name] = info.get("version")

print("Found expo-modules-core entries in package-lock.json:")
for path, version in found.items():
    print(f"  {path} -> {version}")
