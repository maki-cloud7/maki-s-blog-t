from PIL import Image
import sys
import numpy as np

def remove_green(image_path, out_path):
    img = Image.open(image_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Calculate how "green" a pixel is
    greenness = g - np.maximum(r, b)
    
    # Thresholds for chroma keying
    upper = 50.0
    lower = 10.0
    
    # Calculate new alpha
    alpha_mask = 255.0 - np.clip((greenness - lower) / (upper - lower) * 255.0, 0, 255)
    
    # Spill suppression to remove green halos on edges
    spill = greenness > 0
    data[spill, 1] = np.minimum(g[spill], np.maximum(r[spill], b[spill]))
    
    # Apply alpha
    data[:,:,3] = np.minimum(a, alpha_mask)
    
    Image.fromarray(data.astype(np.uint8)).save(out_path)

if __name__ == "__main__":
    remove_green(sys.argv[1], sys.argv[2])
