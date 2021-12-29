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

        const holdingIds = listHoldingsResp.rows.map((h) => h.holding_id);
        const getRelevantTxQuery = `
            SELECT
                tx_id,
                holding_id,
                datetime,
                buy_sell,
                units,
                price
            FROM transactions
            WHERE holding_id IN ('${holdingIds.join('\',\'')}')
        `;
        console.log(`Get relevant transactions query: ${getRelevantTxQuery}`);
        const getRelevantTxResp = await client.query(getRelevantTxQuery);
        console.log(getRelevantTxResp);

        await client.end();

        response.statusCode = 200;
        response.body = JSON.stringify({
            items: listHoldingsResp.rows.map((h) => {
                return {
                    ...h,
                    transactions: getRelevantTxResp.rows.filter((t) => t.holding_id === h.holding_id)
                }
            })
        });
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
