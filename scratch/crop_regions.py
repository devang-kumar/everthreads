import os
from PIL import Image

logo_path = r"c:\Users\devan\Desktop\everthread\client\public\logo_v5.png"
if not os.path.exists(logo_path):
    print("Logo v5 not found!")
    exit(1)

img = Image.open(logo_path)
width, height = img.size

# Let's crop Region 0 (296 to 1056)
r0 = img.crop((296, 0, 1056, height))
r0.save(r"c:\Users\devan\Desktop\everthread\scratch\region_0.png")

# Crop the Gap 0 area (1000 to 1150)
gap0 = img.crop((1000, 0, 1150, height))
gap0.save(r"c:\Users\devan\Desktop\everthread\scratch\gap_0.png")

# Crop Region 1 (1080 to 1260)
r1 = img.crop((1080, 0, 1260, height))
r1.save(r"c:\Users\devan\Desktop\everthread\scratch\region_1.png")

# Crop around 54.5% (which is 1362)
around_545 = img.crop((1300, 0, 1420, height))
around_545.save(r"c:\Users\devan\Desktop\everthread\scratch\around_545.png")

print("Cropped successfully!")
