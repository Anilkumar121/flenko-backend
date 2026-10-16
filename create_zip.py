import os
import zipfile

def create_update_zip():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.abspath(os.path.join(base_dir, '..', 'flenko_domain_update.zip'))

    exclude_dirs = {'.git', 'node_modules', '.gemini', '.system_generated', '__pycache__'}
    exclude_extensions = {'.pyc'}

    print(f"Creating zip at: {zip_path}")
    count = 0
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if any(file.endswith(ext) for ext in exclude_extensions):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir)
                z.write(full_path, rel_path)
                count += 1

    print(f"Packed {count} files. Zip size: {os.path.getsize(zip_path) / (1024*1024):.2f} MB")

if __name__ == '__main__':
    create_update_zip()
