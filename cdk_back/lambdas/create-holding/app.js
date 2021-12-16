const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Client, Pool } = require('pg');
const fsp = require('fs').promises;
const fs = require('fs');
const copyFrom = require('pg-copy-streams').from;
const { json2tsv } = require('tsv-json');

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

        // Check if ticker already exists, if it does then FK to it to 
        // reduce number of ticker prices required
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
            '${coinDataFetch['symbol'].toUpperCase()}',
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

        // Use postgres COPY for historical data
        const coinGeckoHistoricalDataEndpoint = (
            `https://api.coingecko.com/api/v3/coins/${pickedCryptoId}/market_chart`
            + '?vs_currency=gbp'
            + '&days=max'
            + '&interval=daily'
        );
        const historicalRes = await axios.get(coinGeckoHistoricalDataEndpoint);
        const tsvHistorical = historicalRes.data.prices.map(([datetime, price]) => {
            if (parseFloat(price)) {
                return [
                    `${uuidv4()}`,                          // tp_id
                    tickerId,                               // ticker_id
                    new Date(datetime).toISOString(),       // datetime
                    `${price}`,                             // price
                    '0',                                    // twenty_four_hour_change (TBD)
                ];
            }
        });

        console.log('Writing historical data to TSV in preparation for PG COPY');
        await fsp.writeFile('/tmp/bulk.tsv', json2tsv(tsvHistorical), 'utf8');
        console.log('TSV file written successfully');

        // const readData = await fsp.readFile('/tmp/bulk.csv', 'utf8');
        // console.log(`CSV read successfully ${readData}`);

        console.log('COPYing file to PG');
        const pool = new Pool();
        console.log("Connecting to PG pool");
        const poolClient = await pool.connect();
        console.log("Connected to PG pool");
        const stream = poolClient.query(copyFrom('COPY ticker_prices FROM STDIN'));
        const fileStream = fs.createReadStream('/tmp/bulk.tsv');
        fileStream.pipe(stream);

        const streamEnd = new Promise((resolve, reject) => {
            fileStream.on('error', (err) => {
                console.log(`File stream error ${err}`);
                poolClient.release();
                reject();
            });
            stream.on('error', (err) => {
                console.log(`Stream error ${err}`);
                poolClient.release();
                reject();
            });
            stream.on('finish', () => {
                console.log('Stream completed');
                poolClient.release();
                resolve(stream);
            });
        });
        const streamRes = await streamEnd;
        console.log(streamRes);

        // pool.connect(async (err, client, done) => {
        //     console.log("Connected to PG pool");
        //     const stream = client.query(copyFrom('COPY ticker_prices FROM STDIN'));
        //     const fileStream = fs.createReadStream('/tmp/bulk.csv');
        //     fileStream.on('error', (err) => {
        //         console.log(`File stream error ${err}`);
        //         done();
        //     });
        //     stream.on('error', (err) => {
        //         console.log(`Stream error ${err}`);
        //         done();
        //     });
        //     stream.on('finish', done)
        //     fileStream.pipe(stream)
        // });

        // const poolClient = await pool.connect();
        // try {
        //     const stream = poolClient.query(copyFrom('COPY ticker_prices FROM STDIN'));
        //     const fileStream = fs.createReadStream('/tmp/bulk.csv');
        //     fileStream.on('error', (err) => {
        //         console.log(err);
        //         throw err;
        //     });
        //     stream.on('error', (err) => {
        //         console.log(err);
        //         throw err;
        //     });
        //     stream.on('finish', () => {
        //         console.log("Stream finished")
        //         throw 1;
        //     });
        //     fileStream.pipe(stream);
        // } finally {
        //     poolClient.release();
        // }
        console.log('COPY completed');

        response.statusCode = 200;
        response.body = "Success";
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
