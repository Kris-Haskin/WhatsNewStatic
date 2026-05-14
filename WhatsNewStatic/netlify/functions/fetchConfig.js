const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const configDbId = process.env.NOTION_CONFIG_DB_ID;

exports.handler = async function (event, context) {
    try {
        const response = await notion.databases.query({
            database_id: configDbId,
        });

        const config = {};
        response.results.forEach(entry => {
            const key = entry.properties.Setting?.title?.[0]?.plain_text ?? null;
            const value = entry.properties.Value?.rich_text?.[0]?.plain_text ?? null;
            if (key && value !== null) config[key] = value;
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify(config),
        };
    } catch (error) {
        console.error('Error fetching config from Notion:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};