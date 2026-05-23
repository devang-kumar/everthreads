import os
from PIL import Image
import numpy as np

logo_path = r"c:\Users\devan\Desktop\everthread\client\public\logo_v5.png"
if not os.path.exists(logo_path):
    print("Logo v5 not found!")
    exit(1)

img = Image.open(logo_path)
print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")

# Convert to numpy array to analyze alpha channel and black pixels
data = np.array(img)
height, width = data.shape[:2]

if data.shape[2] == 4:
    alpha = data[:, :, 3]
    rgb = data[:, :, :3]
else:
    # No alpha, treat as grayscale or rgb
    alpha = np.ones((height, width)) * 255
    rgb = data[:, :, :3]

# Find horizontal projection of non-white / non-transparent pixels
# Since background is white or transparent, let's find dark pixels (RGB sum < 300) and alpha > 0
dark_pixels = (alpha > 50) & (np.sum(rgb, axis=2) < 400)

# Project horizontally
col_counts = np.sum(dark_pixels, axis=0)

# Print columns where there is a gap (i.e. col_counts is 0 or very small in the middle of the logo)
print("Logo horizontal profile:")
for x in range(width):
    if col_counts[x] > 0:
        pass # print(f"Col {x}: {col_counts[x]} pixels")

# Let's find contiguous regions of dark pixels
regions = []
in_region = False
start = 0
for x in range(width):
    if col_counts[x] > 0 and not in_region:
        start = x
        in_region = True
    elif col_counts[x] == 0 and in_region:
        regions.append((start, x - 1))
        in_region = False
if in_region:
    regions.append((start, width - 1))

print(f"Found {len(regions)} solid regions:")
for idx, r in enumerate(regions):
    print(f"  Region {idx}: {r[0]} to {r[1]} (width {r[1] - r[0] + 1})")

# Let's find the main gap between the two major text chunks
if len(regions) >= 2:
    for i in range(len(regions) - 1):
        gap_start = regions[i][1] + 1
        gap_end = regions[i+1][0] - 1
        print(f"  Gap {i}: {gap_start} to {gap_end} (width {gap_end - gap_start + 1})")
        # Center of gap in percentage of width
        gap_center = (gap_start + gap_end) / 2
        print(f"    Center: {gap_center} ({gap_center / width * 100:.2f}%)")
