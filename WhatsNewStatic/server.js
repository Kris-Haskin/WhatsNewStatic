require('dotenv').config();  // loads .env into process.env

const express = require('express');
const path = require('path');
const { handler }                    = require('./netlify/functions/fetchNotion');
const { handler: igHandler }         = require('./netlify/functions/fetchInstagram');
const { handler: configHandler }     = require('./netlify/functions/fetchConfig');
const { handler: folderHandler }     = require('./netlify/functions/fetchDocumentFolder');
const { handler: serveImageHandler } = require('./netlify/functions/serveImage');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/.netlify/functions/fetchNotion', async (req, res) => {
    const result = await handler({}, {});
    res.status(result.statusCode).set(result.headers).send(result.body);
});


app.get('/.netlify/functions/fetchInstagram', async (req, res) => {
    const result = await igHandler({}, {});
    res.status(result.statusCode).set(result.headers).send(result.body);
});

app.get('/.netlify/functions/fetchConfig', async (req, res) => {
    const result = await configHandler({}, {});
    res.status(result.statusCode).set(result.headers).send(result.body);
});

app.get('/.netlify/functions/fetchDocumentFolder', async (req, res) => {
    const result = await folderHandler({}, {});
    res.status(result.statusCode).set(result.headers).send(result.body);
});

app.get('/.netlify/functions/serveImage', async (req, res) => {
    const result = await serveImageHandler({ queryStringParameters: req.query }, {});
    if (result.isBase64Encoded) {
        res.status(result.statusCode)
           .set(result.headers)
           .send(Buffer.from(result.body, 'base64'));
    } else {
        res.status(result.statusCode).set(result.headers || {}).send(result.body);
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
