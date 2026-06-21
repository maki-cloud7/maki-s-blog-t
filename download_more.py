import urllib.request, json, os, random
target_dir = "/Users/maki/Desktop/二次元博客/夏色绘卷/public"
def dl(tags, fname):
    url = f"https://safebooru.org/index.php?page=dapi&s=post&q=index&tags={tags}&json=1&limit=20"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read().decode())
            if data:
                item = random.choice(data)
                urllib.request.urlretrieve(item.get('file_url'), os.path.join(target_dir, fname))
                print(f"Downloaded {fname}")
    except Exception as e:
        print(f"Failed {fname}: {e}")

dl("scenery+sky+-1girl", "article3.jpg")
dl("scenery+building+-1girl", "article4.jpg")
dl("scenery+sunset+-1girl", "article5.jpg")
