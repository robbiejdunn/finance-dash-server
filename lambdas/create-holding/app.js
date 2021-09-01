const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const CoinGecko = require('coingecko-api');
const lodash = require('lodash');
const TickersTableName = process.env.TICKERS_TABLE_NAME;
const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;

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
    dynamoDbClient = new AWS.DynamoDB(options);
    return dynamoDbClient;
};
const dbClient = makeClient()

const CoinGeckoClient = new CoinGecko();

let response;
exports.handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        let requestData = JSON.parse(event.body);

        // create Ticker
        let data = await CoinGeckoClient.coins.list();
        let dataCoinList = data['data'];
        let pickedCrypto = lodash.filter(dataCoinList, x => x['symbol'] === requestData.symbol.toLowerCase());
        let pickedCryptoId = pickedCrypto[0]['id'];

        let coinData = await CoinGeckoClient.coins.fetch(pickedCryptoId, {
            localization: false,
            tickers: false,
            market_data: false,
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
                    S: requestData.symbol
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
                    S: requestData.symbol
                },
                'units': {
                    N: '0'
                },
                'currentPrice': {
                    N: '0'
                },
                'tickerId': {
                    S: tickerId
                }
            }
        }

        await dbClient.putItem(params).promise();

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
