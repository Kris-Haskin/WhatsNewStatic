//const { Client } = require('@notionhq/client');

//const pageId = "eb1babbc034c4619a0a8674928181a50";
//const apiKey = "secret_MHwIkM5f3RNIiLUbkCkVjAUztCZPeE6tx6jF8EostMS";

//const notion = new Client({ auth: apiKey });

//exports.handler = async function
//    (event, context) {
//    const response = await fetchWhatsNewList();
//   // res.json(response);
//    return {
//        statusCode: 200,
//        body: JSON.stringify({
//response        }),
//    };
//};
//async function fetchWhatsNewList() {
//    try {
//        const response = await notion.databases.query({
//            database_id: pageId,
//        });
//        return processWhatsNewList(response.results);
//    } catch (error) {
//        console.error('Error fetching data from Notion:', error);
//        return [];
//    }
//}

//function processWhatsNewList(whatsNewList) {
//    return whatsNewList.map((entry) => {
//        const nameData = entry.properties.Name.title[0].text.content;
//        const textData = entry.properties.Text.rich_text[0].text.content;
//        let photoUrl = null;

//        if (entry.properties.Photo && entry.properties.Photo.files && entry.properties.Photo.files.length > 0) {
//            photoUrl = entry.properties.Photo.files[0].file.url;
//        }

//        return {
//            name: nameData,
//            text: textData,
//            photo: photoUrl,
//        };
//    });
//}

///////////////////////////
//const { Client } = require('@notionhq/client');

//const pageId = "eb1babbc034c4619a0a8674928181a50";
//const apiKey = "secret_MHwIkM5f3RNIiLUbkCkVjAUztCZPeE6tx6jF8EostMS";

//const notion = new Client({ auth: apiKey });

//exports.handler = async function(event, context) {
//    try {
//        const response = await fetchWhatsNewList();
//        return {
//            statusCode: 200,
//            body: JSON.stringify(response)
//        };
//    } catch (error) {
//        console.error('Error fetching data from Notion:', error);
//        return {
//            statusCode: 500,
//            body: JSON.stringify({ error: 'Internal server error' })
//        };
//    }
//};

//async function fetchWhatsNewList() {
//    const response = await notion.databases.query({
//        database_id: pageId,
//    });
//    return processWhatsNewList(response.results);
//}

//function processWhatsNewList(whatsNewList) {
//    const processedList = whatsNewList.map((entry) => {
//        const nameData = entry.properties.Name.title[0].text.content;
//        const textData = entry.properties.Text.rich_text[0].text.content;
//        let photoUrl = null;

//        if (entry.properties.Photo && entry.properties.Photo.files && entry.properties.Photo.files.length > 0) {
//            photoUrl = entry.properties.Photo.files[0].file.url;
//        }

//        return {
//            name: nameData,
//            text: textData,
//            photo: photoUrl,
//        };
//    });
//    return processedList;
//}
const { Client } = require('@notionhq/client');

const pageId = "eb1babbc034c4619a0a8674928181a50";
const apiKey = "secret_MHwIkM5f3RNIiLUbkCkVjAUztCZPeE6tx6jF8EostMS";

const notion = new Client({ auth: apiKey });

exports.handler = async function (event, context) {
    console.log('fetchNotion.js function is running!');

    try {
        const response = await fetchWhatsNewList();
        const htmlResponse = generateHTML(response);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
            },
            body: htmlResponse,
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

        return {
            name: nameData,
            text: textData,
            photo: photoUrl,
        };
    });

    return processedList;
}

function generateHTML(data) {
    const slidesHTML = data.map(item => {
        return `
            <div class="slide">
                <h2>${item.name}</h2>
                <p>${item.text}</p>
                ${item.photo ? `<img src="${item.photo}" alt="${item.name}">` : ''}
            </div>
        `;
    });

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notion Page Display</title>
            <style>
                /* Add your CSS styles for the slideshow here */
                .slide {
                    /* Your slide styles */
                }
                /* Add more styles as needed */
            </style>
        </head>
        <body>
        <h1>H1 tetset</h1>
           <div id="slide-container">${slidesHTML.join('')}</div>
            <script>
                // JavaScript code for controlling the slideshow
                const slides = document.querySelectorAll('.slide');
                let currentIndex = 0;

                const displayNextSlide = () => {
                    slides[currentIndex].style.display = 'none'; // Hide current slide
                    currentIndex = (currentIndex + 1) % slides.length; // Move to next slide
                    slides[currentIndex].style.display = 'block'; // Show next slide
                };

                displayNextSlide(); // Display the first slide

                setInterval(displayNextSlide, 3000); // Switch to the next slide every 3 seconds
            </script>        </body>
        </html>
    `;
}
