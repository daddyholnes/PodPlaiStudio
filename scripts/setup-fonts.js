import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');

// Create the necessary directories
const publicFontsDir = path.join(CLIENT_DIR, 'public', 'assets', 'fonts');
const distFontsDir = path.join(CLIENT_DIR, 'dist', 'assets', 'fonts');

// Ensure the directories exist
[publicFontsDir, distFontsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Copy fonts from download directory if it exists
const downloadedFontsDir = path.join(CLIENT_DIR, 'src', 'assets', 'fonts');
if (fs.existsSync(downloadedFontsDir)) {
  const fontFiles = fs.readdirSync(downloadedFontsDir);
  
  fontFiles.forEach(fontFile => {
    const sourcePath = path.join(downloadedFontsDir, fontFile);
    const publicDestPath = path.join(publicFontsDir, fontFile);
    const distDestPath = path.join(distFontsDir, fontFile);
    
    // Copy to public directory
    fs.copyFileSync(sourcePath, publicDestPath);
    console.log(`Copied ${fontFile} to public fonts directory`);
    
    // Copy to dist directory if it exists
    if (fs.existsSync(path.dirname(distDestPath))) {
      fs.copyFileSync(sourcePath, distDestPath);
      console.log(`Copied ${fontFile} to dist fonts directory`);
    }
  });
} else {
  console.warn(`Warning: Downloaded fonts directory not found at ${downloadedFontsDir}`);
  console.log('Please run npm run download-fonts first');
}

console.log('Font setup complete!');
