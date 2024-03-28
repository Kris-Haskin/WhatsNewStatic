const express = require('express');
const path = require('path'); // Import the path module

const { Client } = require('@notionhq/client');

const app = express();
const PORT = process.env.PORT || 3000;

const pageId = "eb1babbc034c4619a0a8674928181a50";
const apiKey = "secret_MHwIkM5f3RNIiLUbkCkVjAUztCZPeE6tx6jF8EostMS";

const notion = new Client({ auth: apiKey });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/.netlify/functions/fetchNotion', async (req, res) => {
    try {
        const response = await fetchWhatsNewList();
        res.json(response);
    } catch (error) {
        console.error('Error fetching data from Notion:', error);
        res.status(500).send('Internal server error');
    }
});


async function fetchWhatsNewList() {
    try {
        const response = await notion.databases.query({
            database_id: pageId,
        });
        return processWhatsNewList(response.results);
    } catch (error) {
        console.error('Error fetching data from Notion:', error);
        return [];
    }
}

function processWhatsNewList(whatsNewList) {
    return whatsNewList.map((entry) => {
        const nameData = entry.properties.Name.title[0].text.content;
        const textData = entry.properties.Text.rich_text[0].text.content;
        let photoUrl = null;

        if (entry.properties.Photo && entry.properties.Photo.files && entry.properties.Photo.files.length > 0) {
            photoUrl = entry.properties.Photo.files[0].file.url;
        }

        return {
            name: nameData,
            text: textData,
            photo: photoUrl,
        };
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
