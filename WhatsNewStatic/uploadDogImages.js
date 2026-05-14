// uploadDogImages.js
// Run once from the project folder to push local images into Netlify Blobs.
// Usage:  node uploadDogImages.js
//
// Requires in .env:
//   NETLIFY_SITE_ID=...
//   NETLIFY_TOKEN=...

require('dotenv').config();
const { getStore } = require('@netlify/blobs');
const fs   = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '..', '..', 'Dogs');
const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp)$/i;

async function upload() {
    if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_TOKEN) {
        console.error('Missing NETLIFY_SITE_ID or NETLIFY_TOKEN in .env');
        process.exit(1);
    }

    const store = getStore({
        name:   'document-folder',
        siteID: process.env.NETLIFY_SITE_ID,
        token:  process.env.NETLIFY_TOKEN,
    });

    const files = fs.readdirSync(IMAGE_DIR).filter(f => IMAGE_EXT.test(f));

    if (files.length === 0) {
        console.log('No image files found in', IMAGE_DIR);
        return;
    }

    console.log(`Found ${files.length} image(s) — uploading to Netlify Blobs...\n`);

    for (const file of files) {
        const filePath = path.join(IMAGE_DIR, file);
        const data     = fs.readFileSync(filePath);
        await store.set(file, data);
        console.log(`  ✓  ${file}`);
    }

    console.log('\nAll done. Flip "Folder Active" to true in Notion App Config to see them in the show.');
}

upload().catch(err => {
    console.error('Upload failed:', err.message);
    process.exit(1);
});
