const AWS = require('aws-sdk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');

const TickersTableName = process.env.TICKERS_TABLE_NAME;
const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;
const HistoricalDataTopicArn = process.env.HISTORICAL_TOPIC_ARN;

// TODO: move to utils / shared location
const makeClient = () => {
    const options = {
        region: 'eu-west-2'
    };
    if(process.env.LOCALSTACK_HOSTNAME) {
        options.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
    }
    const dynamoDbClient = new AWS.DynamoDB(options);
    return dynamoDbClient;
};
const dbClient = makeClient();


exports.handler = async (event, context) => {
    const response = {
        headers: {        
            'Access-Control-Allow-Headers' : 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        }
    }
    try {
        // console.log('Received event:', JSON.stringify(event, null, 2));
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
        // console.log(coinData);

        let coinDataFetch = coinData['data'];
        const tickerId = uuidv4();

        let params = {
            TableName: TickersTableName,
            Item: {
                'id': {
                    S: tickerId
                },
                'name': {
                    S: coinDataFetch['name']
                },
                'symbol': {
                    S: coinDataFetch['symbol']
                },
                'description': {
                    S: coinDataFetch['description']['en']
                },
                'imageUrl': {
                    S: coinDataFetch['image']['large']
                },
                'coinId': {
                    S: pickedCryptoId
                }
            }
        };

        await dbClient.putItem(params).promise();

        params = {
            TableName: HoldingsTableName,
            Item: {
                'id': {
                    S: uuidv4()
                },
                'name': {
                    S: coinDataFetch['name']
                },
                'symbol': {
                    S: coinDataFetch['symbol']
                },
                'units': {
                    N: '0'
                },
                'currentPrice': {
                    N: `${coinDataFetch['market_data']['current_price']['gbp']}`
                },
                'tickerId': {
                    S: tickerId
                },
                'marketValue': {
                    N: '0'
                },
                'twentyFourHourChange': {
                    N: `${coinDataFetch['market_data']['price_change_24h']}`
                },
                'marketCap': {
                    N: `${coinDataFetch['market_data']['market_cap']['gbp']}`
                },
                'volume': {
                    N: `${coinDataFetch['market_data']['total_volume']['gbp']}`
                }
            }
        }

        await dbClient.putItem(params).promise();

        // POSTGRES
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
        // POSTGRES

        response.statusCode = 200;
        response.body = "Success";
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
