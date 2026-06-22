import glob
from PIL import Image

def remove_white_bg(img_path):
    print(f"Processing {img_path}")
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # Using a simple tolerance to remove the white background
    # We only want to remove the pure/almost pure white background.
    # Since we can't easily floodfill perfectly without risking jagged edges,
    # let's try removing pixels that are very close to white, but only if they 
    # are near the edges. Actually, floodfill is safer. Let's use floodfill.
    
    # Actually PIL's floodfill is on ImageDraw, but wait, ImageDraw.floodfill modifies the image in place.
    from PIL import ImageDraw
    # We flood fill with (0,0,0,0) starting from the four corners.
    ImageDraw.floodfill(img, xy=(0, 0), value=(255, 255, 255, 0), thresh=20)
    ImageDraw.floodfill(img, xy=(img.width-1, 0), value=(255, 255, 255, 0), thresh=20)
    ImageDraw.floodfill(img, xy=(0, img.height-1), value=(255, 255, 255, 0), thresh=20)
    ImageDraw.floodfill(img, xy=(img.width-1, img.height-1), value=(255, 255, 255, 0), thresh=20)
    
    # We also do a pass to clean up any remaining pure white on the very edges
    # (Sometimes floodfill leaves a 1px border)
    
    img.save(img_path, "PNG")
    print(f"Saved {img_path}")

for path in glob.glob("public/images/chino_*.png"):
    remove_white_bg(path)
