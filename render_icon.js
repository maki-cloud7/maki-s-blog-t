import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const svgContent = fs.readFileSync(path.resolve('public/sakura-icon.svg'), 'utf-8');

  // We set margin 0, padding 0, and background transparent to capture just the SVG
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; }
          svg { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);

  // Generate 180x180 Apple Touch Icon (Apple recommends 180x180 for iPhone)
  await page.setViewportSize({ width: 180, height: 180 });
  await page.screenshot({ path: 'public/apple-touch-icon.png', omitBackground: true });

  // Generate 32x32 Favicon PNG (Modern browsers prefer this over .ico)
  await page.setViewportSize({ width: 32, height: 32 });
  await page.screenshot({ path: 'public/favicon-32x32.png', omitBackground: true });
  
  // Also 192x192 for Android Chrome
  await page.setViewportSize({ width: 192, height: 192 });
  await page.screenshot({ path: 'public/android-chrome-192x192.png', omitBackground: true });

  await browser.close();
  console.log('PNG icons successfully generated.');
})();
