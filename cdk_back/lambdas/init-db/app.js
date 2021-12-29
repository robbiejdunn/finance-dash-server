var response = require('cfn-response');
const { Client } = require('pg');

exports.handler = async(event, context) => {
    const requestType = event['RequestType'];
    console.log(`${requestType} event received`)

    let responseStatus = response.FAILED;
    if (requestType === 'Delete') {
        responseStatus = response.SUCCESS;
    } else {
        // create database if it doesn't already exist
        const createDbClient = new Client({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: 'postgres',
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT,
        });
        await createDbClient.connect();
        try {
            const res = await createDbClient.query('CREATE DATABASE financedashdb');
            console.log(res);
        }
        catch (err) {
            console.log(err);
        }
        await createDbClient.end();

        const client = new Client({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: 'financedashdb',
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT,
        });
        await client.connect();

        // Tickers table
        try {
            const createTickersTableQuery = `
                CREATE TABLE tickers(
                    ticker_id                   varchar(40) PRIMARY KEY,
                    ticker_name                 varchar(40),
                    symbol                      varchar(40),
                    current_price               numeric,
                    twenty_four_hour_change     numeric,
                    market_cap                  numeric,
                    volume                      numeric,
                    image_url                   varchar(400),
                    coin_id                     varchar(40)
                )
            `;
            const createTickersTableRes = await client.query(createTickersTableQuery);
            console.log(createTickersTableRes);
        }
        catch (err) {
            console.log(err);
        }

        // Holdings table
        try {
            const createHoldingsTableQuery = `
                CREATE TABLE holdings(
                    holding_id                  varchar(40) PRIMARY KEY,
                    ticker_id                   varchar(40),
                    color                       varchar(7),
                    CONSTRAINT fk_ticker
                        FOREIGN KEY(ticker_id)
                            REFERENCES tickers(ticker_id)
                )
            `;
            const createHoldingsTableRes = await client.query(createHoldingsTableQuery);
            console.log(createHoldingsTableRes);
        }
        catch (err) {
            console.log(err);
        }

        // Transactions table
        try {
            const createTransactionsTableQuery = `
                CREATE TABLE transactions(
                    tx_id                       varchar(40) PRIMARY KEY,
                    holding_id                  varchar(40),
                    datetime                    timestamp,
                    buy_sell                    varchar(10),
                    units                       numeric,
                    price                       numeric,
                    CONSTRAINT fk_holding
                        FOREIGN KEY(holding_id)
                            REFERENCES holdings(holding_id)
                )
            `;
            const createTransactionsTableRes = await client.query(createTransactionsTableQuery);
            console.log(createTransactionsTableRes);
        }
        catch (err) {
            console.log(err);
        }

        // Ticker prices table
        try {
            const createTickerPricesTableQuery = `
                CREATE TABLE ticker_prices(
                    tp_id                       varchar(40) PRIMARY KEY,
                    ticker_id                   varchar(40),
                    datetime                    timestamp,
                    price                       numeric,
                    twenty_four_hour_change     numeric,
                    market_cap                  numeric,
                    volume                      numeric,
                    last_updated                timestamp,
                    CONSTRAINT fk_ticker
                        FOREIGN KEY(ticker_id)
                            REFERENCES tickers(ticker_id)
                )
            `;
            const createTickerPricesTableRes = await client.query(createTickerPricesTableQuery);
            console.log(createTickerPricesTableRes);
        }
        catch (err) {
            console.log(err);
        }

        // Get holding view
        try {
            const createGetHoldingViewQuery = `
                CREATE OR REPLACE VIEW get_holding_view AS
                    SELECT
                        holdings.holding_id AS holding_id,
                        tickers.ticker_name AS ticker_name,
                        tickers.symbol AS ticker_symbol,
                        tickers.current_price AS current_price,
                        tickers.twenty_four_hour_change AS twenty_four_hour_change,
                        tickers.market_cap AS market_cap,
                        tickers.volume AS volume,
                        tickers.image_url AS image_url,
                        tickers.coin_id AS coin_id,
                        tickers.ticker_id AS ticker_id,
                        holdings.color AS color
                    FROM holdings 
                        INNER JOIN tickers ON holdings.ticker_id=tickers.ticker_id
            `;
            const createGetHoldingViewRes = await client.query(createGetHoldingViewQuery);
            console.log(createGetHoldingViewRes);
        } catch (err) {
            console.log(err);
        }

        // List holdings view
        try {
            const createListHoldingsViewQuery = `
                CREATE OR REPLACE VIEW list_holdings_view AS
                    SELECT DISTINCT ON (h)
                        h.holding_id AS holding_id,
                        t.ticker_name AS ticker_name,
                        t.symbol AS ticker_symbol,
                        t.image_url AS ticker_logo,
                        p.price AS ticker_price,
                        p.twenty_four_hour_change AS ticker_twenty_four_change,
                        p.last_updated AS ticker_last_updated
                    FROM holdings h
                        JOIN tickers t on h.ticker_id = t.ticker_id
                        JOIN (
                            SELECT
                                C.*,
                                row_number() OVER (
                                    PARTITION BY C.ticker_id
                                    ORDER BY C.datetime DESC
                                ) AS rn
                            FROM ticker_prices C
                        ) p ON p.ticker_id = t.ticker_id and p.rn = 1
            `;
            const createListHoldingsViewRes = await client.query(createListHoldingsViewQuery);
            console.log(createListHoldingsViewRes);
        } catch (err) {
            console.log(err);
        }

        await client.end();
    }
    return response.send(event, context, responseStatus, {});
};
