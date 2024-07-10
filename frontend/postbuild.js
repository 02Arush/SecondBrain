const fs = require('fs');
const path = require('path');

// Paths
const distDir = path.join(__dirname, 'dist'); // Adjust this if your build directory is different
const manifestPath = path.join(distDir, 'manifest.json');
const htmlFilePath = path.join(distDir, 'index.html');
const assetsSrcDir = path.join(__dirname, 'assets', 'images');
const assetsDestDir = path.join(distDir, 'assets', 'images');

// Add manifest.json
const manifestContent = {
  "short_name": "Fasthabit",
  "name": "Fasthabit",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "./assets/images/icon.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "./assets/images/icon.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
};

fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2));
console.log('manifest.json added.');

// Modify index.html to include manifest.json
let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
const manifestLink = '<link rel="manifest" href="/manifest.json">';
if (!htmlContent.includes(manifestLink)) {
  htmlContent = htmlContent.replace('</head>', `${manifestLink}</head>`);
}
fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('index.html modified to include manifest.json.');

// Function to copy a directory recursively
function copyDirectorySync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy assets directory
copyDirectorySync(assetsSrcDir, assetsDestDir);
console.log('Assets copied to dist directory.');
