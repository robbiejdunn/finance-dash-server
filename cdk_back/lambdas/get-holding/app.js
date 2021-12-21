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
        const holdingId = event.multiValueQueryStringParameters.id[0];

        const client = new Client();
        await client.connect();

        // Get holding joined by ticker
        const getHoldingQuery = `
            SELECT * FROM get_holding_view WHERE holding_id='${holdingId}'
        `;
        const getHoldingResp = await client.query(getHoldingQuery);
        console.log(getHoldingResp);
        if (getHoldingResp.rowCount !== 1) {
            throw Error(`Expected 1 row returned found ${getHoldingResp.rowCount}`);
        }

        // Get transactions for the holding
        const getTransactionsForHoldingQuery = `
            SELECT * FROM transactions WHERE holding_id='${holdingId}'
        `;
        const getTransactionsForHoldingRes = await client.query(getTransactionsForHoldingQuery);
        console.log(getTransactionsForHoldingRes);

        // Get ticker prices for the associated ticker id
        const holdingTickerId = getHoldingResp.rows[0].ticker_id;
        const getTickerPricesForHoldingQuery = `
            SELECT * FROM ticker_prices WHERE ticker_id='${holdingTickerId}' ORDER BY datetime ASC
        `;
        const getTickerPricesForHoldingRes = await client.query(getTickerPricesForHoldingQuery);
        console.log(getTickerPricesForHoldingRes);

        await client.end();

        const responseData = {
            holding: getHoldingResp.rows[0],
            tickerPrices: getTickerPricesForHoldingRes.rows,
            transactions: getTransactionsForHoldingRes.rows,
        }
        response.statusCode = 200;
        response.body = JSON.stringify(responseData);
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
