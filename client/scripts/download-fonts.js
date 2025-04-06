import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, '../src/assets/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontFiles = [
  { 
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5fBBc4.woff2',
    filename: 'Roboto-Light.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
    filename: 'Roboto-Regular.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
    filename: 'Roboto-Medium.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2',
    filename: 'Roboto-Bold.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/robotomono/v22/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vq_ROW4.woff2',
    filename: 'RobotoMono-Regular.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/robotomono/v22/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_7Pq_ROW4.woff2',
    filename: 'RobotoMono-Medium.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeAZ9hiA.woff2',
    filename: 'Inter-Light.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
    filename: 'Inter-Regular.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2',
    filename: 'Inter-Medium.woff2' 
  },
  { 
    url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2',
    filename: 'Inter-Bold.woff2' 
  }
];

// Add promise tracking to ensure all downloads complete
let downloadPromises = [];

// Download each font file
fontFiles.forEach(({ url, filename }) => {
  const filePath = path.join(fontsDir, filename);
  
  console.log(`Downloading ${url} to ${filePath}...`);
  
  const file = fs.createWriteStream(filePath);
  
  // Add a promise to track this download
  downloadPromises.push(new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Check for HTTP errors
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: HTTP ${response.statusCode}`));
        file.close();
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      console.error(`Error downloading ${filename}: ${err.message}`);
      reject(err);
    });
  }));
});

Promise.allSettled(downloadPromises).then(results => {
  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;
  
  console.log(`Font download process completed. Downloaded ${successful} fonts successfully, ${failed} failed.`);
  console.log('If you see this message, the script has run to completion.');
});

console.log('Font download process initiated...');
console.log('Run this script using: npm run download-fonts');
