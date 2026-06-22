import sys
from PIL import Image, ImageDraw

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    
    # Floodfill from corners to make white transparent
    ImageDraw.floodfill(img, xy=(0, 0), value=(255, 255, 255, 0), thresh=15)
    ImageDraw.floodfill(img, xy=(img.width-1, 0), value=(255, 255, 255, 0), thresh=15)
    ImageDraw.floodfill(img, xy=(0, img.height-1), value=(255, 255, 255, 0), thresh=15)
    ImageDraw.floodfill(img, xy=(img.width-1, img.height-1), value=(255, 255, 255, 0), thresh=15)
    
    img.save(out_path, "PNG")

remove_white_bg(sys.argv[1], sys.argv[2])
