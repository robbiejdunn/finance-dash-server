const { Client } = require('pg');

exports.handler = async (event, context) => {
    const response = {
        headers: {        
            'Access-Control-Allow-Headers' : 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        }
    }
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        const requestData = JSON.parse(event.body);
        const client = new Client();
        await client.connect();
        const delTxQuery = `
            DELETE FROM transactions
            WHERE tx_id IN ('${requestData.txIds.join('\',\'')}')
        `;
        console.log(delTxQuery);
        const delTxRes = await client.query(delTxQuery);
        console.log(delTxRes);
        await client.end();
        response.statusCode = 200;
        response.body = `Transactions deleted successfully`;
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
}
