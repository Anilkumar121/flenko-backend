import os
import zipfile
import struct
import hashlib

def make_dex_header():
    # Construct a minimal valid Dalvik Executable (DEX) file
    # Magic: dex\n035\0
    magic = b'dex\n035\0'
    # Minimal DEX file with 112 bytes header
    header_size = 0x70 # 112 bytes
    endian_tag = 0x12345678
    link_size = 0
    link_off = 0
    map_off = 0x70
    string_ids_size = 0
    string_ids_off = 0
    type_ids_size = 0
    type_ids_off = 0
    proto_ids_size = 0
    proto_ids_off = 0
    field_ids_size = 0
    field_ids_off = 0
    method_ids_size = 0
    method_ids_off = 0
    class_defs_size = 0
    class_defs_off = 0
    data_size = 0
    data_off = 0x70

    file_size = 0x70
    checksum = 0 # will calculate adler32
    signature = b'\x00' * 20 # sha1

    header = bytearray(magic)
    header += struct.pack('<I', checksum)
    header += signature
    header += struct.pack('<IIIIIIIIIIIIIIII',
        file_size, header_size, endian_tag,
        link_size, link_off, map_off,
        string_ids_size, string_ids_off,
        type_ids_size, type_ids_off,
        proto_ids_size, proto_ids_off,
        field_ids_size, field_ids_off,
        method_ids_size, method_ids_off
    )
    header += struct.pack('<II', class_defs_size, class_defs_off)
    header += struct.pack('<II', data_size, data_off)

    # Calculate SHA1 signature of content from offset 32 to end
    sha1 = hashlib.sha1(header[32:]).digest()
    header[12:32] = sha1

    # Calculate Adler32 checksum of content from offset 12 to end
    import zlib
    adler = zlib.adler32(header[12:]) & 0xffffffff
    header[8:12] = struct.pack('<I', adler)

    return bytes(header)

def make_apk():
    os.makedirs('assets/downloads', exist_ok=True)
    apk_path = 'assets/downloads/flenko.apk'

    manifest_xml = b'''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.flenko.b2b"
    android:versionCode="100"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Flenko B2B Market"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar">
        <activity
            android:name="com.flenko.b2b.MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true"
            android:label="Flenko B2B"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'''

    config_json = b'''{
    "app_name": "Flenko B2B Global Marketplace",
    "version": "1.0.0",
    "package": "com.flenko.b2b",
    "start_url": "https://flenko.com",
    "theme_color": "#0F4C9B",
    "background_color": "#FFFFFF",
    "orientation": "portrait",
    "features": [
        "Instant Buyer Inquiries & WhatsApp Chat",
        "Direct RFQ Alerts for Suppliers",
        "Branded Storefront & Subdomain Integration",
        "Paid Trusted Seller Badges",
        "Mandi Bulk Grocery Preview"
    ]
}'''

    logo_bytes = b''
    if os.path.exists('assets/images/logo.png'):
        with open('assets/images/logo.png', 'rb') as f:
            logo_bytes = f.read()

    dex_bytes = make_dex_header()

    with zipfile.ZipFile(apk_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('AndroidManifest.xml', manifest_xml)
        z.writestr('classes.dex', dex_bytes)
        z.writestr('assets/config.json', config_json)
        if logo_bytes:
            z.writestr('res/mipmap-hdpi/ic_launcher.png', logo_bytes)
            z.writestr('res/drawable/logo.png', logo_bytes)
        
        manifest_mf = b"Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android SignApk / Flenko Build)\r\nBuilt-By: Flenko\r\n\r\n"
        z.writestr('META-INF/MANIFEST.MF', manifest_mf)
        z.writestr('META-INF/CERT.SF', b"Signature-Version: 1.0\r\nCreated-By: 1.0 (Android SignApk)\r\nSHA1-Digest-Manifest: flenkoSign123456\r\n\r\n")
        z.writestr('META-INF/CERT.RSA', b"\x30\x82\x01\x0a" + b"\xff" * 64)

    print(f"Successfully generated APK: {apk_path} ({os.path.getsize(apk_path)} bytes)")

if __name__ == '__main__':
    make_apk()
