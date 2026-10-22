import os
import zipfile
import shutil

def create_update_zip():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.abspath(os.path.join(base_dir, '..'))
    zip_path = os.path.join(target_dir, 'flenko_domain_update.zip')
    latest_zip_path = os.path.join(target_dir, 'flenko_latest_upload.zip')

    exclude_dirs = {
        '.git',
        'node_modules',
        '.wwebjs_auth',
        '.wwebjs_cache',
        '.gemini',
        '.system_generated',
        '__pycache__',
        'tests',
        '.neon'
    }

    exclude_files = {
        'create_zip.py',
        'build_apk.py',
        'test_seo_suite.js',
        'patch_index.js',
        'qr.txt'
    }

    exclude_extensions = {'.pyc', '.log'}

    print(f"[ZIP] Packaging clean domain upload zip at:\n  -> {zip_path}")
    count = 0
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files:
                    continue
                if any(file.endswith(ext) for ext in exclude_extensions):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir)
                z.write(full_path, rel_path)
                count += 1

    file_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"[SUCCESS] Successfully packed {count} files into '{os.path.basename(zip_path)}' ({file_size_mb:.2f} MB)")

    # Also create duplicate copy named flenko_latest_upload.zip for convenience
    shutil.copy2(zip_path, latest_zip_path)
    print(f"[SUCCESS] Created copy at:\n  -> {latest_zip_path}")

if __name__ == '__main__':
    create_update_zip()

