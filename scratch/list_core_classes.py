import os
import zipfile

node_modules_dir = r"C:\Users\hp\SabiSpell-V1\SabiSpell\node_modules"
core_aar = None

# Find expo-modules-core AAR file
for root, dirs, files in os.walk(node_modules_dir):
    for file in files:
        if "expo-modules-core" in root and file.endswith(".aar"):
            core_aar = os.path.join(root, file)
            print(f"Found AAR: {os.path.relpath(core_aar, node_modules_dir)}")
            
            # Read classes.jar inside the AAR
            try:
                with zipfile.ZipFile(core_aar, "r") as z:
                    if "classes.jar" in z.namelist():
                        z.extract("classes.jar", root)
                        classes_jar_path = os.path.join(root, "classes.jar")
                        
                        with zipfile.ZipFile(classes_jar_path, "r") as cz:
                            type_classes = [name for name in cz.namelist() if "expo/modules/kotlin/types/" in name]
                            print(f"Total type classes in core: {len(type_classes)}")
                            for tc in type_classes[:30]:
                                print(f"  {tc}")
                                
                        os.remove(classes_jar_path)
            except Exception as e:
                print("Error reading jar inside AAR:", e)
