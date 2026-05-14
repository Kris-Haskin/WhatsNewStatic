const https = require('https');

exports.handler = async function (event, context) {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;

    const url = `https://graph.facebook.com/v18.0/${userId}/media?fields=id,caption,media_type,media_url,timestamp&access_token=${token}`;

    try {
        const data = await new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let raw = '';
                res.on('data', chunk => raw += chunk);
                res.on('end', () => resolve(JSON.parse(raw)));
                res.on('error', reject);
            }).on('error', reject);
        });

        if (!data.data) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'No media returned', detail: data })
            };
        }

        const slides = data.data
            .filter(post => post.media_type === 'IMAGE')
            .map(post => ({
                name: 'Instagram',
                text: post.caption || '',
                photo: post.media_url,
                duration: null,
            }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
            body: JSON.stringify(slides),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};

//exports.handler = async function (event, context) {
//    const mockSlides = [
//        {
//            name: 'Instagram',
//            text: 'Check out our latest post!',
//            photo: 'https://picsum.photos/seed/ig1/800/600',
//            duration: 8
//        },
//        {
//            name: 'Instagram',
//            text: 'Great day at the shop.',
//            photo: 'https://picsum.photos/seed/ig2/800/600',
//            duration: 8
//        },
//        {
//            name: 'Instagram',
//            text: 'Come visit us this weekend.',
//            photo: null,
//            duration: 6
//        }
//    ];

//    return {
//        statusCode: 200,
//        headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify(mockSlides)
//    };
//};