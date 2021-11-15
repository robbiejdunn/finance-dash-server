const AWS = require('aws-sdk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
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

const makeSNSClient = () => {
    const options = {
        region: 'eu-west-2'
    };
    if(process.env.LOCALSTACK_HOSTNAME) {
        options.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
    }
    const client = new AWS.SNS(options);
    return client;
}
const snsClient = makeSNSClient();

// since ddb can only take 25 items at a time, split into chunks
const splitItemsChunks = (arr, chunkSize=25) => {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}

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

        params = {
            Message: `${pickedCryptoId} ${tickerId}`,
            TopicArn: HistoricalDataTopicArn
        }
        console.log("Posting topic", params);

        const publishResp = await snsClient.publish(params).promise();
        console.log(publishResp);

        response.statusCode = 200;
        response.body = "Success";
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
