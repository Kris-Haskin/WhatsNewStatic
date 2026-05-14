// fetchDocumentFolder.js
// Lists images stored in the 'document-folder' Netlify Blob store and returns
// them as slide objects. Each photo URL points to the serveImage function so
// the image is proxied through Netlify (works both in dev and production).
//
// Blob store setup:
//   Production  — Netlify auto-injects credentials; no env vars needed.
//   Local dev   — Add to .env:
//                   NETLIFY_SITE_ID=<your-site-id>
//                   NETLIFY_TOKEN=<your-personal-access-token>
//               Then run `netlify dev` instead of `node server.js` so the
//               Blobs client can reach your live site's storage.

const { getStore } = require('@netlify/blobs');

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;

exports.handler = async function (event, context) {
    try {
        const store = getStore('document-folder');

        const { blobs } = await store.list();

        const slides = blobs
            .filter(blob => IMAGE_EXT.test(blob.key))
            .map(blob => ({
                name:   '',
                text:   '',
                photo:  `/.netlify/functions/serveImage?key=${encodeURIComponent(blob.key)}`,
                duration: null,   // overridden by appConfig.folderDuration in client.js
                source: 'folder',
            }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type':  'application/json',
                'Cache-Control': 'no-store',
            },
            body: JSON.stringify(slides),
        };
    } catch (err) {
        console.error('fetchDocumentFolder error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
