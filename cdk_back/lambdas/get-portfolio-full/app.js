const { Client } = require('pg');

exports.handler = async (event, context) => {
    const response = {
        headers: {
            'Access-Control-Allow-Headers' : 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET'
        }
    };
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));

        const client = new Client();
        await client.connect();

        // Get holdings (joined with ticker)
        const getHoldingsQuery = `
            SELECT * FROM get_holding_view
        `;
        const getHoldingsRes = await client.query(getHoldingsQuery);
        console.log(getHoldingsRes);

        // Get transactions
        const getTransactionsQuery = `
            SELECT * FROM transactions
        `;
        const getTransactionsRes = await client.query(getTransactionsQuery);
        console.log(getTransactionsRes);

        // Get ticker prices
        const getTickerPricesQuery = `
            SELECT * FROM ticker_prices
        `;
        const getTickerPricesRes = await client.query(getTickerPricesQuery);
        console.log(getTickerPricesRes);

        await client.end();

        response.statusCode = 200;
        response.body = JSON.stringify({
            holdings: getHoldingsRes.rows,
            transactions: getTransactionsRes.rows,
            tickerPrices: getTickerPricesRes.rows,
        });
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
