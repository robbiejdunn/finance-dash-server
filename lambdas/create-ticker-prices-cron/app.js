const axios = require('axios');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const TickerTableName = process.env.TICKER_TABLE;
const TickerPriceTableName = process.env.TICKER_PRICE_TABLE_NAME;
const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;
// const TransactionsTableName = process.env.TRANSACTIONS_TABLE_NAME;

let dynamoDbClient;
const makeClient = () => {
    const options = {
        region: 'eu-west-2'
    };
    if(process.env.LOCALSTACK_HOSTNAME) {
        options.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
    }
    dynamoDbClient = new AWS.DynamoDB(options);
    return dynamoDbClient;
};
const dbClient = makeClient()

exports.handler = async (event, context) => {
    try {
        let params = {
            TableName: TickerTableName
        };
        const tickers = await dbClient.scan(params).promise();  
        const coinIds = tickers.Items.map((t) => t['coinId']['S']).join('%2C');
        const coinGeckoEndpoint = ('https://api.coingecko.com/api/v3/simple/price'
            + `?ids=${coinIds}`
            + '&vs_currencies=gbp'
            + '&include_24hr_change=true'
            + '&include_market_cap=true'
            + '&include_24hr_vol=true'
        );
        const response = await axios.get(coinGeckoEndpoint);
        const data = response.data;
        let tickerIdToCoin = {};
        const dateStr = new Date().toISOString();
        await Promise.all(tickers.Items.map(async (t) => {
            params = {
                TableName: TickerPriceTableName,
                Item: {
                    'id': {
                        S: uuidv4()
                    },
                    'tickerId': {
                        S: t['id']['S']
                    },
                    'datetime': {
                        S: dateStr
                    },
                    'price': {
                        N: `${data[t['coinId']['S']]['gbp']}`
                    },
                    'twentyFourHourChange': {
                        N: `${data[t['coinId']['S']]['gbp_24h_change']}`
                    }
                }
            };
            await dbClient.putItem(params).promise();
            tickerIdToCoin[t['id']['S']] = {
                price: data[t['coinId']['S']]['gbp'],
                change: data[t['coinId']['S']]['gbp_24h_change'],
                marketCap: data[t['coinId']['S']]['gbp_market_cap'],
                volume: data[t['coinId']['S']]['gbp_24h_vol']
            };
        }));
        params = {
            TableName: HoldingsTableName
        };
        const holdings = await dbClient.scan(params).promise();
        await Promise.all(holdings.Items.map(async (h) => {
            const currCoin = tickerIdToCoin[h['tickerId']['S']];
            params = {
                TableName: HoldingsTableName,
                Key: {
                    'id': {
                        S: h['id']['S']
                    }
                },
                UpdateExpression: `SET currentPrice = :currentPrice, marketValue = :marketValue, twentyFourHourChange = :twentyFourHourChange, marketCap = :marketCap, volume = :volume`,
                ExpressionAttributeValues: {
                    ':currentPrice': {
                        N: `${currCoin['price']}`
                    },
                    ':marketValue': {
                        N: `${currCoin['price'] * h['units']['N']}`
                    },
                    ':twentyFourHourChange': {
                        N: `${currCoin['change']}`
                    },
                    ':marketCap': {
                        N: `${currCoin['marketCap']}`
                    },
                    ':volume': {
                        N: `${currCoin['volume']}`
                    }
                }
            };
            await dbClient.updateItem(params).promise();
        }));
    } catch (err) {
        console.log(err);
    }
};
