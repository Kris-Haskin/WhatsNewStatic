const { Client } = require('@notionhq/client');

const pageId = "eb1babbc034c4619a0a8674928181a50";
const apiKey = "secret_MHwIkM5f3RNIiLUbkCkVjAUztCZPeE6tx6jF8EostMS";

const notion = new Client({ auth: apiKey });

exports.handler = async function
    (event, context) {
    const response = await fetchWhatsNewList();
   // res.json(response);
    return {
        statusCode: 200,
        body: JSON.stringify({
response        }),
    };
};
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