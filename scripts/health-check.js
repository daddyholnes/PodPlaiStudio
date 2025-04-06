import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const CLIENT_DIST = path.join(CLIENT_DIR, 'dist');

console.log('PodPlai Studio Health Check');
console.log('==========================');

// Check if important directories exist
console.log('\nChecking directories:');
const dirs = [
  { path: CLIENT_DIR, name: 'Client directory' },
  { path: SERVER_DIR, name: 'Server directory' },
  { path: CLIENT_DIST, name: 'Client build directory' }
];

for (const dir of dirs) {
  try {
    const exists = fs.existsSync(dir.path);
    console.log(`✓ ${dir.name}: ${exists ? 'Found' : 'Missing'}`);
    
    if (exists) {
      const stats = fs.statSync(dir.path);
      if (!stats.isDirectory()) {
        console.log(`  ⚠️ Warning: ${dir.path} exists but is not a directory`);
      }
    } else {
      console.log(`  ⚠️ Warning: ${dir.path} not found`);
    }
  } catch (error) {
    console.error(`  ❌ Error checking ${dir.name}:`, error.message);
  }
}

// Check for index.html in client/dist
console.log('\nChecking for built files:');
const indexPath = path.join(CLIENT_DIST, 'index.html');
try {
  const indexExists = fs.existsSync(indexPath);
  console.log(`✓ index.html: ${indexExists ? 'Found' : 'Missing'}`);
  
  if (indexExists) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const hasViewport = content.includes('<meta name="viewport"');
    console.log(`  - Has viewport meta: ${hasViewport ? 'Yes' : 'No'}`);
    
    if (!hasViewport) {
      console.log('  ⚠️ Warning: Missing viewport meta tag. This affects mobile rendering and accessibility.');
    }
  } else {
    console.log('  ⚠️ Warning: No index.html found. Did you run "npm run build"?');
  }
} catch (error) {
  console.error('  ❌ Error checking index.html:', error.message);
}

// Check for port availability
console.log('\nChecking port availability:');
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
};

(async () => {
  try {
    const port5050Available = await checkPort(5050);
    console.log(`✓ Port 5050 (client): ${port5050Available ? 'Available' : 'In use'}`);
    if (!port5050Available) {
      console.log('  ⚠️ Warning: Port 5050 is already in use. Run "npm run check-ports" to free it.');
    }
    
    const port3000Available = await checkPort(3000);
    console.log(`✓ Port 3000 (server): ${port3000Available ? 'Available' : 'In use'}`);
    if (!port3000Available) {
      console.log('  ⚠️ Warning: Port 3000 is already in use. Run "npm run check-ports" to free it.');
    }
  } catch (error) {
    console.error('  ❌ Error checking ports:', error.message);
  }
  
  // Print recommendations
  console.log('\nRecommendations:');
  console.log('1. Ensure client/index.html has a viewport meta tag');
  console.log('   <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  console.log('2. Make sure the server is properly configured to serve the client build');
  console.log('3. Try running "npm run fix:all" to rebuild and restart everything');
  console.log('4. Check the server logs for any errors during startup');

  console.log('\nHealth check complete!');
})();
