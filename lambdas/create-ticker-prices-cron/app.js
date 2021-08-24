const AWS = require('aws-sdk');
const CoinGecko = require('coingecko-api');
const { v4: uuidv4 } = require('uuid');
const TickerTableName = process.env.TICKER_TABLE;
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
    dynamoDbClient = new AWS.DynamoDB(options);
    return dynamoDbClient;
};
const dbClient = makeClient()

const CoinGeckoClient = new CoinGecko();

let response;
exports.handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));

        // get all tickers
        var scanParams = {
            TableName: TickerTableName
        };
        tickers = await dbClient.scan(scanParams).promise();

        console.log(tickers);
        console.log(tickers.Items[0]);
        console.log(tickers.Items[0]['coinId']);

        await Promise.all(tickers.Items.map(async (t) => {
            var coinData = await CoinGeckoClient.simple.price({
                ids: t['coinId']['S'],
                vs_currencies: 'gbp'
            });
            console.log(coinData);
            var putParams = {
                TableName: TickerPriceTableName,
                Item: {
                    'id': {
                        S: uuidv4()
                    },
                    'tickerId': {
                        S: t['id']['S']
                    },
                    'datetime': {
                        S: new Date().toISOString()
                    },
                    'price': {
                        N: `${coinData['data'][t['coinId']['S']]['gbp']}`
                    }
                }
            };
            console.log(putParams);
            await dbClient.putItem(putParams).promise();
            // await dbClient.put(putParams).promise();
        }))
        // tickers.forEach(e => async )

        // var coinData = await CoinGeckoClient.simple.price({
        //     ids: tickers.Items[0]['coinId']['S'],
        //     vs_currencies: 'gbp'
        // })

        // console.log(coinData);

        // Promise.all(tickers.Items.map((t) => createTickerPrice(t['coinId']['S'], t['id']['S'])));
    } catch (err) {
        console.log(err);
    }
};
