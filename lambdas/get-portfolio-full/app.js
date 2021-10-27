const AWS = require('aws-sdk');


const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;
const TransactionsTableName = process.env.TRANSACTIONS_TABLE_NAME;
const TickerPricesTableName = process.env.TICKER_PRICES_TABLE_NAME;


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
const dbClient = makeClient()


exports.handler = async (event, context) => {
    const response = {
        headers: {
            'Access-Control-Allow-Headers' : 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET'
        }
    };
    try {
        let params = {
            TableName: HoldingsTableName
        };
        const holdings = await dbClient.scan(params).promise();
        params = {
            TableName: TransactionsTableName
        };
        const transactions = await dbClient.scan(params).promise();
        params = {
            TableName: TickerPricesTableName
        };
        const tickerPrices = await dbClient.scan(params).promise();

        response.statusCode = 200;
        response.body = JSON.stringify({
            holdings: holdings,
            transactions: transactions,
            tickerPrices: tickerPrices,
        })
        console.log(response)
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
