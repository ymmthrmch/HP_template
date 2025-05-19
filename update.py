import os
import re
import sys

# if len(sys.argv) != 4:
#     print("使い方: python script.py <template_path> <target_dir> <key_name>")
#     sys.exit(1)

template_path = "./includes/head.html" #sys.argv[1]
target_dir = "." #sys.argv[2]
key_name = "head" # sys.argv[3]

with open(template_path, 'r', encoding='utf-8') as f:
    template_content = f.read()

pattern = re.compile(
    rf'<!--\s*KEY:{re.escape(key_name)}\s*-->(.*?)<!--\s*ENDKEY\s*-->',
    re.DOTALL
)

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            replacement = f'<!-- KEY:{key_name} -->\n{template_content}\n<!-- ENDKEY -->'
            new_content = re.sub(pattern, replacement, content)

            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")
            else:
                print(f"No change: {filepath}")