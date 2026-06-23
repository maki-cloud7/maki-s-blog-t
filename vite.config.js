import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  }
});
