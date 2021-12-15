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
        const client = new Client();
        await client.connect();
        console.log("Connected to postgres")

        const listHoldingsQuery = 'SELECT * FROM list_holdings_view';
        console.log(`List holdings query: ${listHoldingsQuery}`);
        const listHoldingsResp = await client.query(listHoldingsQuery);
        console.log(listHoldingsResp);

        await client.end();

        response.statusCode = 200;
        response.body = JSON.stringify({
            items: listHoldingsResp.rows.map(
                obj => ({ ...obj, market_value: `${obj.units * obj.current_price}` })
            )
        });
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
