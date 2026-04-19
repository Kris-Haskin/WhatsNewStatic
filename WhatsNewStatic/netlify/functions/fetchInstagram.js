exports.handler = async function (event, context) {
    const mockSlides = [
        {
            name: 'Instagram',
            text: 'Check out our latest post!',
            photo: 'https://picsum.photos/seed/ig1/800/600',
            duration: 8
        },
        {
            name: 'Instagram',
            text: 'Great day at the shop.',
            photo: 'https://picsum.photos/seed/ig2/800/600',
            duration: 8
        },
        {
            name: 'Instagram',
            text: 'Come visit us this weekend.',
            photo: null,
            duration: 6
        }
    ];

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockSlides)
    };
};