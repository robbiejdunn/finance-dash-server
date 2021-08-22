const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const CoinGecko = require('coingecko-api');
const TickerPriceTableName = process.env.TICKER_PRICE_TABLE_NAME;

// TODO: move to utils / shared location
let dynamoDbClient;
const makeClient = () => {
    const options = {
        region: 'eu-west-2'
    };
    if(process.env.LOCALSTACK_HOSTNAME) {
        options.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
    }
    console.log(`Connecting to AWS DynamoDB at ${options.endpoint}`)
    dynamoDbClient = new AWS.DynamoDB.DocumentClient(options);
    return dynamoDbClient;
};
const dbClient = makeClient()

const CoinGeckoClient = new CoinGecko();

let response;
exports.handler = async (event, context) => {
    try {
        requestData = JSON.parse(event.body);
        console.log('Received event:', JSON.stringify(event, null, 2));

        let currentPriceResponse = await CoinGeckoClient.simple.price({
            ids: requestData.coinId,
            vs_currencies: 'gbp'
        });
        let currentPrice = currentPriceResponse['data'][requestData.coinId]['gbp'];

        var params = {
            TableName: TickerPriceTableName,
            Item: {
                'id': uuidv4(),
                'tickerId': requestData.tickerId,
                'datetime': new Date().toISOString(),
                'price': currentPrice
            }
        }
        console.log(params);
        console.log(`Putting item in DynamoDB table ${params.TableName}`);
        await dbClient.put(params).promise();
        response = {
            statusCode: 200,
            headers: {        
                'Access-Control-Allow-Headers' : 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: `Ticker price created with ID=${params.Item.id}`
        };
    } catch (err) {
        console.log(err);
        return err;
    }
    return response;
};
