
const { Client } = require('@notionhq/client');

const pageId = "eb1babbc034c4619a0a8674928181a50";
const apiKey = "secret_MHwIkM5f3RNIiLUbkCkVjAUztCZPeE6tx6jF8EostMS";

const notion = new Client({ auth: apiKey });

exports.handler = async function (event, context) {
    console.log('fetchNotion.js function is running!');

    try {
        const response = await fetchWhatsNewList();
       // const htmlResponse = generateHTML(response);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                // 'Content-Type': 'text/html',
                'Cache-Control': 'no-store'

            },
            body: JSON.stringify(response),
            //body: htmlResponse,
        };
    } catch (error) {
        console.error('Error fetching data from Notion:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function fetchWhatsNewList() {
    const response = await notion.databases.query({
        database_id: pageId,
    });


    // TEMP: log raw properties of first entry
    console.log('RAW PROPERTIES:', JSON.stringify(response.results[0].properties, null, 2));

    return processWhatsNewList(response.results);
}

function processWhatsNewList(whatsNewList) {
    const processedList = whatsNewList.map((entry) => {
        const nameData = entry.properties.Name.title[0].text.content;
        const textData = entry.properties.Text.rich_text[0].text.content;
        let photoUrl = null;

        if (entry.properties.Photo && entry.properties.Photo.files && entry.properties.Photo.files.length > 0) {
            photoUrl = entry.properties.Photo.files[0].file.url;
        }
        // Duration in seconds from Notion Number field; null = use default
        const duration = entry.properties.Duration?.number ?? null;
        console.log('Duration for', nameData, ':', duration); // ?? server-side log
        //const displaySlide = () => {
        //    const currentItem = data[currentIndex];
        //    console.log('Current slide:', currentItem); 
        return {
            name: nameData,
            text: textData,
            photo: photoUrl,
            duration: duration,

        };
    });

    return processedList;
}



