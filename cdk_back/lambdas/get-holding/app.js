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

        const client = new Client();
        await client.connect();

        // Get holding joined by ticker
        const getHoldingQuery = `
            SELECT * FROM get_holding_view WHERE holding_id='${event.multiValueQueryStringParameters.id[0]}'
        `;
        const getHoldingResp = await client.query(getHoldingQuery);
        console.log(getHoldingResp);

        await client.end();
        // let params = {
        //     TableName: HoldingsTableName,
        //     Key: {
        //         id: {
        //             S: event.multiValueQueryStringParameters.id[0]
        //         }
        //     }
        // };
        // const holdingGetData = await dbClient.getItem(params).promise();

        // params = {
        //     TableName: TickersTableName,
        //     Key: {
        //         id: {
        //             S: holdingGetData.Item.tickerId.S
        //         }
        //     }
        // }
        // const tickerGetData = await dbClient.getItem(params).promise();

        // params = {
        //     TableName: TickerPricesTableName,
        //     IndexName: 'TickerPricesByTickerIDIndex',
        //     ExpressionAttributeValues: {
        //         ':t': {S: holdingGetData.Item.tickerId.S}
        //     },
        //     KeyConditionExpression: 'tickerId = :t'
        // }
        // const tickerPricesGetData = await dbClient.query(params).promise();

        // params = {
        //     TableName: TransactionsTableName,
        //     IndexName: 'TransactionByHoldingIDIndex',
        //     ExpressionAttributeValues: {
        //         ':h': {S: holdingGetData.Item.id.S}
        //     },
        //     KeyConditionExpression: 'holdingId = :h'
        // }
        // const transactionsGetData = await dbClient.query(params).promise();
        
        // const responseData = {
        //     'holding': holdingGetData,
        //     'ticker': tickerGetData,
        //     'tickerPrices': tickerPricesGetData,
        //     'transactions': transactionsGetData
        // }

        response.statusCode = 200;
        // response.body = JSON.stringify(responseData);
        response.body = JSON.stringify({test: 'hi'})

    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
