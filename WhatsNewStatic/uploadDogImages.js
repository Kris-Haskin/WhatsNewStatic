// uploadImages.js
// Clears the Netlify Blobs store, then uploads all images from IMAGE_DIR.
// Usage:  node uploadDogImages.js
//
// Requires in .env:
//   NETLIFY_SITE_ID=...
//   NETLIFY_TOKEN=...

require('dotenv').config();
const { getStore } = require('@netlify/blobs');
const fs   = require('fs');
const path = require('path');

const IMAGE_DIR = `C:\\Users\\vinif\\Pictures\\Ellis's Grad Party`;
const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp)$/i;

async function run() {
    if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_TOKEN) {
        console.error('Missing NETLIFY_SITE_ID or NETLIFY_TOKEN in .env');
        process.exit(1);
    }

    const store = getStore({
        name:   'document-folder',
        siteID: process.env.NETLIFY_SITE_ID,
        token:  process.env.NETLIFY_TOKEN,
    });

    // ── Step 1: Clear existing blobs ─────────────────────────────────────────
    console.log('Clearing existing images from Netlify Blobs...');
    try {
        const { blobs } = await store.list();
        if (blobs.length === 0) {
            console.log('  (store already empty)\n');
        } else {
            for (const blob of blobs) {
                await store.delete(blob.key);
                console.log(`  ✗  deleted: ${blob.key}`);
            }
            console.log();
        }
    } catch (err) {
        console.log('  (store not yet created — nothing to clear)\n');
    }

    // ── Step 2: Upload new images ─────────────────────────────────────────────
    const files = fs.readdirSync(IMAGE_DIR).filter(f => IMAGE_EXT.test(f));

    if (files.length === 0) {
        console.log('No image files found in:', IMAGE_DIR);
        return;
    }

    console.log(`Uploading ${files.length} image(s) from:\n  ${IMAGE_DIR}\n`);

    for (const file of files) {
        const filePath = path.join(IMAGE_DIR, file);
        const data     = fs.readFileSync(filePath);
        await store.set(file, data);
        console.log(`  ✓  ${file}`);
    }

    console.log('\nAll done! The slideshow will pick up the new images on the next refresh.');
}

run().catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
