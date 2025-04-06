import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const CLIENT_DIR = path.join(PROJECT_ROOT, 'client');

// Define the paths
const fontPaths = [
  path.join(CLIENT_DIR, 'public', 'assets', 'fonts'),
  path.join(CLIENT_DIR, 'dist', 'assets', 'fonts')
];

// Create directory structure
fontPaths.forEach(dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
});

console.log('Font directory structure created successfully!');
