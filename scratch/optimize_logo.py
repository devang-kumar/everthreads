import os
from PIL import Image

logo_path = r"c:\Users\devan\Desktop\everthread\client\public\logo_v5.png"
output_path = r"c:\Users\devan\Desktop\everthread\client\public\logo_v5_splash.png"

if os.path.exists(logo_path):
    img = Image.open(logo_path)
    # Resize to 800x800 using Lanczos/High-Quality resampling
    optimized_img = img.resize((800, 800), Image.Resampling.LANCZOS)
    optimized_img.save(output_path, "PNG", optimize=True)
    print(f"Optimized logo saved successfully to {output_path}!")
    print(f"Original size: {os.path.getsize(logo_path)} bytes, New size: {os.path.getsize(output_path)} bytes")
else:
    print("Logo v5 not found!")
