import urllib.request
import json
import os
import random

target_dir = "/Users/maki/Desktop/二次元博客/夏色绘卷/public"
os.makedirs(target_dir, exist_ok=True)

def download_safebooru_image(tags, filename):
    url = f"https://safebooru.org/index.php?page=dapi&s=post&q=index&tags={tags}&json=1&limit=20"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data:
                # choose a random image from the top 20
                item = random.choice(data)
                img_url = item.get('file_url')
                if img_url:
                    print(f"Downloading {img_url} to {filename}...")
                    urllib.request.urlretrieve(img_url, os.path.join(target_dir, filename))
                    print("Success!")
                    return True
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
    return False

# Download background
download_safebooru_image("scenery+sky+clouds+-1girl+-1boy", "bg_hero.jpg")
# Download article thumbnails
download_safebooru_image("scenery+classroom+-1girl", "article1.jpg")
download_safebooru_image("scenery+room+-1girl", "article2.jpg")
# Download project thumbnails
download_safebooru_image("visual_novel+screenshot+-1girl", "project1.jpg")
# Download friend avatars
download_safebooru_image("1girl+cute+face", "avatar1.jpg")
download_safebooru_image("1girl+smile+face", "avatar2.jpg")
