const AWS = require('aws-sdk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
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

// since ddb can only take 25 items at a time, split into chunks
const splitItemsChunks = (arr, chunkSize=25) => {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
};

exports.handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));

        await Promise.all(event.Records.map(async(record) => {
            const recordMsgSplit = record.Sns.Message.split(' ');
            console.log(recordMsgSplit);
            const rId = recordMsgSplit[0];
            const rTickerId = recordMsgSplit[1];
            console.log("ID", rId);
            console.log("Ticker ID", rTickerId);
            const coinGeckoHistoricalDataEndpoint = (
                `https://api.coingecko.com/api/v3/coins/${rId}/market_chart`
                + '?vs_currency=gbp'
                + '&days=max'
                + '&interval=daily'
            );
            const historyResponse = await axios.get(coinGeckoHistoricalDataEndpoint);

            const putRequests = historyResponse.data.prices.map(([datetime, price]) => {
                if(parseFloat(price)) {
                    return {
                        PutRequest: {
                            Item: {
                                'id': {
                                    S: uuidv4()
                                },
                                'tickerId': {
                                    S: `${rTickerId}`
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
        }));        

    } catch (err) {
        console.log(err);
    }
};
