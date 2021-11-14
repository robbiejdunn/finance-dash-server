const AWS = require('aws-sdk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const CoinGecko = require('coingecko-api');
const lodash = require('lodash');
const TickersTableName = process.env.TICKERS_TABLE_NAME;
const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;
const TickerPricesTableName = process.env.TICKER_PRICES_TABLE_NAME;

// TODO: move to utils / shared location
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

const CoinGeckoClient = new CoinGecko();

// since ddb can only take 25 items at a time, split into chunks
const splitItemsChunks = (arr, chunkSize=25) => {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}

let response;
exports.handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        let requestData = JSON.parse(event.body);
        let pickedCryptoId = requestData['coinId'];

        let coinData = await CoinGeckoClient.coins.fetch(pickedCryptoId, {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
        });
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

        console.log(params);

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

        console.log(params);

        await dbClient.putItem(params).promise();
        
        const coinGeckoHistoricalDataEndpoint = (
            `https://api.coingecko.com/api/v3/coins/${pickedCryptoId}/market_chart`
            + '?vs_currency=gbp'
            + '&days=max'
            + '&interval=daily'
        );
        const historyResponse = await axios.get(coinGeckoHistoricalDataEndpoint);
        
        console.log("Got history")
        const putRequests = historyResponse.data.prices.map(([datetime, price]) => {
            if(parseFloat(price)) {
                return {
                    PutRequest: {
                        Item: {
                            'id': {
                                S: uuidv4()
                            },
                            'tickerId': {
                                S: `${tickerId}`
                            },
                            'datetime': {
                                S: new Date(datetime).toISOString()
                            },
                            'price': {
                                N: `${price}`
                            },
                            'twentyFourHourChange': {
                                N: '0'
                            }
                        }
                    }
                }
            }
        });

        const chunks = splitItemsChunks(putRequests);
        // this should be a map but couldn't get working with async
        for (let i = 0; i < chunks.length; i += 1) {
            params = {
                RequestItems: {
                    [TickerPricesTableName]: chunks[i]
                }
            };
            await dbClient.batchWriteItem(params).promise();
        }

        response = {
            statusCode: 200,
            headers: {        
                'Access-Control-Allow-Headers' : 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: `Success`
        };
    } catch (err) {
        console.log(err);
        return err;
    }
    return response;
};
