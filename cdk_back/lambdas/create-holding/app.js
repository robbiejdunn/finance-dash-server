const axios = require('axios');
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
        let requestData = JSON.parse(event.body);
        let pickedCryptoId = requestData['coinId'];

        const coinGeckoFetchEndpoint = (
            `https://api.coingecko.com/api/v3/coins/${pickedCryptoId}`
            + '?localization=false'
            + '&tickers=false'
            + '&market_data=true'
            + '&community_data=false'
            + '&developer_data=false'
        );
        let coinData = await axios.get(coinGeckoFetchEndpoint);

        let coinDataFetch = coinData['data'];
        const tickerId = uuidv4();

        const client = new Client();
        await client.connect();
        console.log("Connected to postgres")

        const createTickerQuery = `INSERT INTO tickers (
            ticker_id,
            ticker_name,
            symbol,
            current_price,
            twenty_four_hour_change,
            market_cap,
            volume,
            image_url,
            coin_id)
        VALUES (
            '${tickerId}',
            '${coinDataFetch['name']}',
            '${coinDataFetch['symbol']}',
            '${coinDataFetch['market_data']['current_price']['gbp']}',
            '${coinDataFetch['market_data']['price_change_24h']}',
            '${coinDataFetch['market_data']['market_cap']['gbp']}',
            '${coinDataFetch['market_data']['total_volume']['gbp']}',
            '${coinDataFetch['image']['large']}',
            '${pickedCryptoId}'
        )`;
        console.log(`Ticker query: ${createTickerQuery}`);
        const createTickerResp = await client.query(createTickerQuery);
        console.log(createTickerResp);

        const createHoldingQuery = `INSERT INTO holdings (
            holding_id,
            units,
            ticker_id)
        VALUES (
            '${uuidv4()}',
            '0',
            '${tickerId}'
        )`;
        console.log(`Holding query: ${createHoldingQuery}`);
        const createHoldingResp = await client.query(createHoldingQuery);
        console.log(createHoldingResp);

        await client.end();

        response.statusCode = 200;
        response.body = "Success";
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
