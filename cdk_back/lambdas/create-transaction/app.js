const { v4: uuidv4 } = require('uuid');
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

        const txId = `${uuidv4()}`

        // Insert transaction row
        const insertTransactionQuery = `
            INSERT INTO transactions (
                tx_id,
                holding_id,
                datetime,
                buy_sell,
                units,
                price
            ) VALUES (
                '${txId}',
                '${requestData.holdingId}',
                '${new Date(requestData.datetime).toISOString()}',
                '${requestData.buySell}',
                '${requestData.units}',
                '${requestData.price}'
            )
        `;
        console.log(`Transaction insert query: ${insertTransactionQuery}`);
        const insertTransactionRes = await client.query(insertTransactionQuery);
        console.log(insertTransactionRes);

        // Update holding units
        let updateOp = '-';
        if (requestData.buySell === 'BUY') {
            updateOp = '+';
        }
        const updateHoldingUnitsQuery = `
            UPDATE holdings
            SET units = units ${updateOp} ${requestData.units}
            WHERE holding_id = '${requestData.holdingId}'
        `;
        console.log(`Holding units update query: ${updateHoldingUnitsQuery}`);
        const updateHoldingUnitsRes = await client.query(updateHoldingUnitsQuery);
        console.log(updateHoldingUnitsRes);

        await client.end();

        const responseData = {
            buy_sell: `${requestData.buySell}`,
            datetime: new Date(requestData.datetime).toISOString(),
            holding_id: `${requestData.holdingId}`,
            price: `${requestData.price}`,
            tx_id: `${txId}`,
            units: `${requestData.units}`,
        };
        response.statusCode = 200;
        response.body = JSON.stringify(responseData);
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
