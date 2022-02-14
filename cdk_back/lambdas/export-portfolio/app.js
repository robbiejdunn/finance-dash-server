const { Client } = require('pg');

exports.handler = async (event, context) => {
    const response = {
        headers: {        
            'Access-Control-Allow-Headers' : 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET'
        }
    }
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        const accountId = event.multiValueQueryStringParameters.accountId[0];
        const client = new Client();
        await client.connect();
        const getHoldingsQuery = `
            SELECT * FROM get_holding_view WHERE account_id='${accountId}'
        `;
        console.log(getHoldingsQuery);
        const getHoldingsRes = await client.query(getHoldingsQuery);
        console.log(getHoldingsRes);
        const holdingIds = getHoldingsRes.rows.map((h) => h.holding_id);
        const getTransactionsQuery = `
            SELECT * FROM transactions
            WHERE holding_id IN ('${holdingIds.join('\',\'')}')
        `;
        console.log(`Get transactions query ${getTransactionsQuery}`);
        const getTransactionsRes = await client.query(getTransactionsQuery);
        console.log(getTransactionsRes);
        await client.end();

        const responseBody = getHoldingsRes.rows.map((h) => {
            return {
                coinID: h.coin_id,
                transactions: getTransactionsRes.rows.filter((t) => t.holding_id === h.holding_id),
            };
        });
        
        console.log(responseBody);

        response.statusCode = 200;
        response.body = JSON.stringify(responseBody);
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
}
