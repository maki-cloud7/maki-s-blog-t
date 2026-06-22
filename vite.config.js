import { defineConfig } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_JS_PATH = path.resolve(__dirname, 'articles.js');
const ARTICLES_DIR = path.resolve(__dirname, 'public/articles');
const FRIENDS_JS_PATH = path.resolve(__dirname, 'friends.js');

// Utility to read and parse friends.js
async function getFriends() {
  try {
    const content = await fs.readFile(FRIENDS_JS_PATH, 'utf-8');
    const arrayStr = content.replace('export const friends = ', '').trim().replace(/;$/, '');
    const parser = new Function(`return ${arrayStr}`);
    return parser();
  } catch (err) {
    console.error("Error reading friends.js", err);
    return [];
  }
}

// Utility to save friends.js
async function saveFriends(friendsArray) {
  const content = `export const friends = ${JSON.stringify(friendsArray, null, 2)};\n`;
  await fs.writeFile(FRIENDS_JS_PATH, content, 'utf-8');
}

// Utility to read and parse articles.js
async function getArticles() {
  try {
    const content = await fs.readFile(ARTICLES_JS_PATH, 'utf-8');
    const arrayStr = content.replace('export const articles = ', '').trim().replace(/;$/, '');
    const parser = new Function(`return ${arrayStr}`);
    return parser();
  } catch (err) {
    console.error("Error reading articles.js", err);
    return [];
  }
}

// Utility to save articles.js
async function saveArticles(articlesArray) {
  const content = `export const articles = ${JSON.stringify(articlesArray, null, 2)};\n`;
  await fs.writeFile(ARTICLES_JS_PATH, content, 'utf-8');
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        archive: path.resolve(__dirname, 'archive.html'),
        projects: path.resolve(__dirname, 'projects.html'),
        friends: path.resolve(__dirname, 'friends.html'),
        post: path.resolve(__dirname, 'post.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        editor: path.resolve(__dirname, 'editor.html')
      }
    }
  },
  plugins: [
    {
      name: 'local-cms-api',
      configureServer(server) {
        
        // API endpoint to get friends
        server.middlewares.use('/api/friends', async (req, res, next) => {
          if (req.method === 'GET') {
            const friends = await getFriends();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(friends));
          } else {
            next();
          }
        });

        // API endpoint to save a friend
        server.middlewares.use('/api/save-friend', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                let friends = await getFriends();
                
                let friendId = data.id;
                if (!friendId) {
                  friendId = Date.now().toString();
                  friends.push({
                    id: friendId,
                    name: data.name,
                    desc: data.desc,
                    url: data.url,
                    avatar: data.avatar || 'https://picsum.photos/100/100'
                  });
                } else {
                  const index = friends.findIndex(f => f.id.toString() === friendId.toString());
                  if (index !== -1) {
                    friends[index] = { ...friends[index], ...data };
                  }
                }
                
                await saveFriends(friends);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            next();
          }
        });

        // API endpoint to delete a friend
        server.middlewares.use('/api/delete-friend', (req, res, next) => {
          if (req.method === 'POST') {
             let body = '';
             req.on('data', chunk => body += chunk);
             req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  if (data.id) {
                    let friends = await getFriends();
                    friends = friends.filter(f => f.id.toString() !== data.id.toString());
                    await saveFriends(friends);
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch(e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
             });
          } else {
             next();
          }
        });

        // API endpoint to get articles
        server.middlewares.use('/api/articles', async (req, res, next) => {
          if (req.method === 'GET') {
            const articles = await getArticles();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(articles));
          } else {
            next();
          }
        });

        // API endpoint to save an article
        server.middlewares.use('/api/save-article', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                let articles = await getArticles();
                
                let articleId = data.id;
                
                if (!articleId) {
                  // Create new article
                  articleId = Date.now().toString(); // unique ID
                  data.id = articleId;
                  
                  articles.unshift({
                    id: articleId,
                    title: data.title,
                    date: data.date,
                    tags: data.tags,
                    summary: data.summary,
                    url: `/post.html?id=${articleId}`,
                    image: data.image || '/article1.jpg' // Default image if empty
                  });
                } else {
                  // Update existing article
                  const index = articles.findIndex(a => a.id.toString() === articleId.toString());
                  if (index !== -1) {
                    articles[index] = {
                      ...articles[index],
                      title: data.title,
                      date: data.date,
                      tags: data.tags,
                      summary: data.summary,
                      image: data.image || articles[index].image
                    };
                  }
                }

                // Ensure directory exists
                await fs.mkdir(ARTICLES_DIR, { recursive: true });

                // Write markdown file
                const mdPath = path.resolve(ARTICLES_DIR, `${articleId}.md`);
                await fs.writeFile(mdPath, data.content, 'utf-8');
                
                // Write back to articles.js
                await saveArticles(articles);
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, id: articleId }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            next();
          }
        });
        
        // API endpoint to upload an image
        server.middlewares.use('/api/upload-image', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const base64Data = data.dataUrl.split(';base64,').pop();
                const buffer = Buffer.from(base64Data, 'base64');
                const safeName = Date.now() + '-' + data.filename.replace(/[^a-zA-Z0-9.-]/g, '');
                
                const uploadDir = path.resolve(__dirname, 'public/uploads');
                await fs.mkdir(uploadDir, { recursive: true });
                
                const filePath = path.resolve(uploadDir, safeName);
                await fs.writeFile(filePath, buffer);
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, url: '/uploads/' + safeName }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            next();
          }
        });

        // API endpoint to trigger git push (Deploy)
        server.middlewares.use('/api/deploy', async (req, res, next) => {
          if (req.method === 'POST') {
            try {
              // Add all changes, commit, and push
              // "|| true" prevents error if there's nothing to commit
              await execPromise('git add .');
              await execPromise('git commit -m "Auto deploy from Local CMS" || true');
              const { stdout, stderr } = await execPromise('git push');
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: stdout || stderr }));
            } catch (e) {
              console.error("Deploy error:", e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message || e.toString() }));
            }
          } else {
            next();
          }
        });

        // API endpoint to delete an article
        server.middlewares.use('/api/delete-article', (req, res, next) => {
          if (req.method === 'POST') {
             let body = '';
             req.on('data', chunk => body += chunk);
             req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const articleId = data.id;
                  
                  if (articleId) {
                    let articles = await getArticles();
                    articles = articles.filter(a => a.id.toString() !== articleId.toString());
                    await saveArticles(articles);
                    
                    try {
                      await fs.unlink(path.resolve(ARTICLES_DIR, `${articleId}.md`));
                    } catch(e) {
                      console.error('File already deleted or missing', e);
                    }
                  }
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch(e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
             });
          } else {
             next();
          }
        });
      }
    }
  ]
});
