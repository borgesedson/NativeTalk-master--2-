import os
import re

patterns = {
    r'\.fullName': '.name',
    r'fullName:': 'name:',
    r'fullName ': 'name ',
    r'\._id': '.id',
    r'_id:': 'id:',
    r'\.profilePic': '.avatar_url',
    r'profilePic:': 'avatar_url:',
    r'nativeLanguage': 'native_language'
}

src_dir = r"c:\Users\Cunae\Downloads\NativeTalk-master (2)\NativeTalk-master\frontend\src"

def process_file(file_path):
    if not file_path.endswith(('.js', '.jsx', '.ts', '.tsx')):
        return
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    modified = content
    for pattern, replacement in patterns.items():
        modified = re.sub(pattern, replacement, modified)
    
    if modified != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Updated: {file_path}")

for root, dirs, files in os.walk(src_dir):
    for file in files:
        process_file(os.path.join(root, file))
