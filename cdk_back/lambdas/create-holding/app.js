const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Client, Pool } = require('pg');
const fsp = require('fs').promises;
const fs = require('fs');
const copyFrom = require('pg-copy-streams').from;
const { json2tsv } = require('tsv-json');

const catTwentyColors = [
    "#1f77b4",
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5",
];

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
            '${pickedCryptoId}')
        `;
        console.log(`Ticker query: ${createTickerQuery}`);
        const createTickerResp = await client.query(createTickerQuery);
        console.log(createTickerResp);

        const createHoldingQuery = `INSERT INTO holdings (
            holding_id,
            units,
            ticker_id,
            color)
        VALUES (
            '${uuidv4()}',
            '0',
            '${tickerId}',
            '${catTwentyColors[Math.floor(Math.random() * catTwentyColors.length)]}')
        `;
        console.log(`Holding query: ${createHoldingQuery}`);
        const createHoldingResp = await client.query(createHoldingQuery);
        console.log(createHoldingResp);

        // Create 1 current ticker price
        const coinGeckoTickerEndpoint = ('https://api.coingecko.com/api/v3/simple/price'
            + `?ids=${pickedCryptoId}`
            + '&vs_currencies=gbp'
            + '&include_24hr_change=true'
            + '&include_market_cap=true'
            + '&include_24hr_vol=true'
        );
        const coinGeckoTickerRes = await axios.get(coinGeckoTickerEndpoint);
        const tData = coinGeckoTickerRes.data;
        const dateStr = new Date().toISOString();
        const insertTickerPriceQuery = `
            INSERT INTO ticker_prices (
                tp_id,
                ticker_id,
                datetime,
                price,
                twenty_four_hour_change,
                market_cap,
                volume,
                last_updated
            ) VALUES (
                '${uuidv4()}',
                '${tickerId}',
                '${dateStr}',
                '${tData[pickedCryptoId]['gbp']}',
                '${tData[pickedCryptoId]['gbp_24h_change']}',
                '${tData[pickedCryptoId]['gbp_market_cap']}',
                '${tData[pickedCryptoId]['gbp_24h_vol']}',
                '${dateStr}'
            )
        `;
        console.log(insertTickerPriceQuery);
        const insertTickerPriceRes = await client.query(insertTickerPriceQuery);
        console.log(insertTickerPriceRes);
        await client.end();

        // Use postgres COPY for historical data
        const coinGeckoHistoricalDataEndpoint = (
            `https://api.coingecko.com/api/v3/coins/${pickedCryptoId}/market_chart`
            + '?vs_currency=gbp'
            + '&days=max'
            + '&interval=daily'
        );
        const historicalRes = await axios.get(coinGeckoHistoricalDataEndpoint);

        const tsvHistorical = historicalRes.data.prices.map((curr, index) => {
            const histDate = curr[0];
            return [
                `${uuidv4()}`,                                      // tp_id
                tickerId,                                           // ticker_id
                new Date(histDate).toISOString(),                   // datetime
                `${curr[1]}`,                                       // price
                'null',                                             // twenty_four_hour_change
                `${historicalRes.data.market_caps[index][1]}`,      // market cap
                `${historicalRes.data.total_volumes[index][1]}`,    // volume
                'null',                                             // last_updated 
            ]
        });

        console.log('Writing historical data to TSV in preparation for PG COPY');
        const tmpFileName = `/tmp/bulk_${uuidv4()}.tsv`;

        try {
            await fsp.writeFile(tmpFileName, json2tsv(tsvHistorical), 'utf8');
            console.log(`TSV file ${tmpFileName} written successfully`);
    
            console.log('COPYing file to PG');
            const pool = new Pool();
            console.log("Connecting to PG pool");
            const poolClient = await pool.connect();
            try {
                console.log("Connected to PG pool");
                const stream = poolClient.query(copyFrom('COPY ticker_prices FROM STDIN WITH NULL as \'null\''));
                const fileStream = fs.createReadStream(tmpFileName);
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
                console.log('COPY completed');
            } finally {
                poolClient.release();
            }
        } finally {
            await fsp.unlink(tmpFileName);
            console.log(`Deleted file ${tmpFileName} successfully`);
        } 

        response.statusCode = 200;
        response.body = "Success";
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
