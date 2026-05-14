// serveImage.js
// Fetches a single image from the 'document-folder' Netlify Blob store and
// returns it as a base64-encoded HTTP response so the browser can display it.
//
// Usage:  /.netlify/functions/serveImage?key=my-photo.jpg
//
// Images are cached by the browser for 1 hour (Cache-Control: public, max-age=3600)
// so repeated views of the same slide don't re-hit this function.

const { getStore } = require('@netlify/blobs');

const MIME = {
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    gif:  'image/gif',
    webp: 'image/webp',
};

exports.handler = async function (event, context) {
    const key = event.queryStringParameters?.key;

    if (!key) {
        return { statusCode: 400, body: 'Missing ?key= parameter' };
    }

    try {
        const store = getStore('document-folder');
        const data  = await store.get(key, { type: 'arrayBuffer' });

        if (!data) {
            return { statusCode: 404, body: `Image not found: ${key}` };
        }

        const ext         = key.split('.').pop().toLowerCase();
        const contentType = MIME[ext] || 'application/octet-stream';

        return {
            statusCode: 200,
            headers: {
                'Content-Type':  contentType,
                'Cache-Control': 'public, max-age=3600',
            },
            body:            Buffer.from(data).toString('base64'),
            isBase64Encoded: true,
        };
    } catch (err) {
        console.error('serveImage error:', err);
        return { statusCode: 500, body: `Error serving image: ${err.message}` };
    }
};
