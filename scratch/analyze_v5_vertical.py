import os
from PIL import Image
import numpy as np

logo_path = r"c:\Users\devan\Desktop\everthread\client\public\logo_v5.png"
if not os.path.exists(logo_path):
    print("Logo v5 not found!")
    exit(1)

img = Image.open(logo_path)
data = np.array(img)
height, width = data.shape[:2]

if data.shape[2] == 4:
    alpha = data[:, :, 3]
    rgb = data[:, :, :3]
else:
    alpha = np.ones((height, width)) * 255
    rgb = data[:, :, :3]

dark_pixels = (alpha > 50) & (np.sum(rgb, axis=2) < 400)

# Project vertically (find which rows have dark pixels)
row_counts = np.sum(dark_pixels, axis=1)

active_rows = np.where(row_counts > 0)[0]
if len(active_rows) > 0:
    min_y = active_rows[0]
    max_y = active_rows[-1]
    print(f"Text vertical range: Y={min_y} to Y={max_y} (height {max_y - min_y + 1})")
    print(f"Vertical center: {(min_y + max_y) / 2} ({(min_y + max_y) / 2 / height * 100:.2f}%)")
else:
    print("No dark pixels found!")
