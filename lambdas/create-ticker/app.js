const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const CoinGecko = require('coingecko-api');
const lodash = require('lodash');
const TickerTableName = process.env.TICKER_TABLE;

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
        request_data = JSON.parse(event.body);
        console.log('Received event:', JSON.stringify(event, null, 2));
        let data = await CoinGeckoClient.coins.list();
        let dataCoinList = data['data'];
        let pickedCrypto = lodash.filter(dataCoinList, x => x['symbol'] === request_data.symbol.toLowerCase());
        let pickedCryptoId = pickedCrypto[0]['id'];

        let coinData = await CoinGeckoClient.coins.fetch(pickedCryptoId, {
            localization: false,
            tickers: false,
            market_data: false,
            community_data: false,
            developer_data: false,
        });
        let coinDataFetch = coinData['data'];
        
        let tickerName = coinDataFetch['name']
        console.log(coinData);

        var params = {
            TableName: TickerTableName,
            Item: {
                'id': uuidv4(),
                'name': coinDataFetch['name'],
                'symbol':  request_data.symbol,
                'description': coinDataFetch['description']['en'],
                'imageUrl': coinDataFetch['image']['large'],
            }
        };
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
            body: `Ticker created with ID=${params.Item.id}`
        };
    } catch (err) {
        console.log(err);
        return err;
    }
    return response;
};
