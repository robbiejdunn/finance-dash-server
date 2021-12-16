const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');

exports.handler = async (event, context) => {
    try {
        const client = new Client();
        await client.connect();

        // Scan tickers table to determine which coin prices we need
        const scanTickersQuery = `
            SELECT 
                ticker_id,
                coin_id
            FROM tickers
        `;
        const scanTickersRes = await client.query(scanTickersQuery);

        // Pull coin prices from Coingecko
        const coinIds = scanTickersRes.rows.map(obj => obj['coin_id']).join('%2C');
        const coinGeckoEndpoint = ('https://api.coingecko.com/api/v3/simple/price'
            + `?ids=${coinIds}`
            + '&vs_currencies=gbp'
            + '&include_24hr_change=true'
            + '&include_market_cap=true'
            + '&include_24hr_vol=true'
        );
        const response = await axios.get(coinGeckoEndpoint);
        const data = response.data;

        // Insert new ticker price for each scanned ticker
        let tickerIdToCoin = {};
        const dateStr = new Date().toISOString();
        await Promise.all(scanTickersRes.rows.map(async (t) => {
            const insertTickerPriceQuery = `
                INSERT INTO ticker_prices (
                    tp_id,
                    ticker_id,
                    datetime,
                    price,
                    twenty_four_hour_change
                ) VALUES (
                    '${uuidv4()}',
                    '${t['ticker_id']}',
                    '${dateStr}',
                    '${data[t['coin_id']]['gbp']}',
                    '${data[t['coin_id']]['gbp_24h_change']}'
                )
            `;
            // console.log(`Insert ticker price query ${insertTickerPriceQuery}`);
            await client.query(insertTickerPriceQuery);
            // console.log(insertTickerPriceRes);

            tickerIdToCoin[t['ticker_id']] = {
                price: data[t['coin_id']]['gbp'],
                change: data[t['coin_id']]['gbp_24h_change'],
                marketCap: data[t['coin_id']]['gbp_market_cap'],
                volume: data[t['coin_id']]['gbp_24h_vol']
            };
        }));
        await client.end();
    } catch (err) {
        console.log(err);
    }
};
