const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Automatically set root directory to 'dist'
const rootDir = 'dist';

// Paths
const distDir = path.join(__dirname, rootDir); // Adjust this if your build directory is different
const manifestPath = path.join(distDir, 'manifest.json');
const htmlFilePath = path.join(distDir, 'index.html');
const assetsSrcDir = path.join(__dirname, 'assets', 'images');
const assetsDestDir = path.join(distDir, 'assets', 'images');

// Add manifest.json
const manifestContent = {
  "short_name": "SecondBrain",
  "name": "SecondBrain",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },

    {
      "src": "./assets/images/icon.png",
      "type": "image/png",
      "sizes": "1024x1024"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
};

fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2));
console.log('manifest.json added.');

// Modify index.html to include manifest.json and service worker registration
let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
const manifestLink = '<link rel="manifest" href="/manifest.json">';
const serviceWorkerScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(error) {
          console.log('ServiceWorker registration failed: ', error);
        });
      });
    }
  </script>
`;

if (!htmlContent.includes(manifestLink)) {
  htmlContent = htmlContent.replace('</head>', `${manifestLink}
  </head>`);
}

if (!htmlContent.includes(serviceWorkerScript.trim())) {
  htmlContent = htmlContent.replace('</body>', `${serviceWorkerScript}
  </body>`);
}

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('index.html modified to include manifest.json and service worker registration.');

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

// Generate service worker using Workbox config
try {
  execSync('npx workbox-cli generateSW workbox-config.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error generating service worker with Workbox:', error);
  process.exit(1);
}

console.log('Service worker generated successfully.');
