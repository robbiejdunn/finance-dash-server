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

        await client.end();
        
        // let params = {
        //     TableName: HoldingsTableName
        // };
        // const holdings = await dbClient.scan(params).promise();

        // params = {
        //     TableName: TransactionsTableName
        // };
        // const transactions = await dbClient.scan(params).promise();

        // params = {
        //     TableName: TickerPricesTableName
        // };
        // const tickerPrices = await dbClient.scan(params).promise();

        // params = {
        //     TableName: TickersTableName
        // };
        // const tickers = await dbClient.scan(params).promise();

        response.statusCode = 200;
        response.body = JSON.stringify({
            holdings: getHoldingsRes.rows,
            // transactions: transactions,
            // tickerPrices: tickerPrices,
            // tickers: tickers,
        })
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
