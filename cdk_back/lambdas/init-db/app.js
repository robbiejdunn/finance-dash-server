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
        const createTickerRes = await client.query(
            `CREATE TABLE tickers(
                ticker_id                   varchar(40) PRIMARY KEY,
                ticker_name                 varchar(40),
                symbol                      varchar(40),
                current_price               numeric,
                twenty_four_hour_change     numeric,
                market_cap                  numeric,
                volume                      numeric,
                image_url                   varchar(400),
                coin_id                     varchar(40),
                CONSTRAINT fk_ticker
                    FOREIGN KEY(ticker_id)
                        REFERENCES tickers(ticker_id)
            )`
        );
        console.log(createTickerRes);
        const createHoldingRes = await client.query(
            `CREATE TABLE holdings(
                holding_id                  varchar(40) PRIMARY KEY,
                units                       numeric,
                ticker_id                   varchar(40),
                CONSTRAINT fk_ticker
                    FOREIGN KEY(ticker_id)
                        REFERENCES tickers(ticker_id)
            )
            `
        );
        console.log(createHoldingRes);
        await client.end();
    }
    return response.send(event, context, responseStatus, {});
};
