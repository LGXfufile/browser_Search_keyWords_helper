const fs = require('fs');
const path = require('path');
const https = require('https');

const dependencies = [
  {
    url: 'https://unpkg.com/vue@3/dist/vue.global.js',
    dest: 'popup/vue.global.js'
  },
  {
    url: 'https://unpkg.com/element-plus',
    dest: 'popup/element-plus.js'
  },
  {
    url: 'https://unpkg.com/element-plus/dist/index.css',
    dest: 'popup/element-plus.css'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
    dest: 'popup/xlsx.full.min.js'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest);
      console.error(`Error downloading ${url}: ${err.message}`);
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const dep of dependencies) {
    await downloadFile(dep.url, dep.dest);
  }
  console.log('All dependencies downloaded successfully!');
}

downloadAll().catch(console.error); 