import os
import glob
from PIL import Image

def optimize_images():
    # Background
    bg_path = "public/bg_hero.jpg"
    if os.path.exists(bg_path):
        img = Image.open(bg_path).convert("RGB")
        img.save("public/bg_hero.webp", "webp", quality=80)
        print("Converted bg_hero.jpg to bg_hero.webp")

    # Mascot images
    for png_file in glob.glob("public/images/mascot_*.png"):
        webp_path = png_file.replace(".png", ".webp")
        img = Image.open(png_file)
        img.save(webp_path, "webp", quality=85)
        print(f"Converted {png_file} to {webp_path}")

if __name__ == "__main__":
    optimize_images()
