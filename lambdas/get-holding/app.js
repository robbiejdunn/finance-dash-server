const AWS = require('aws-sdk');
const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;
const TickersTableName = process.env.TICKERS_TABLE_NAME;
const TickerPricesTableName = process.env.TICKER_PRICES_TABLE_NAME;
const TransactionsTableName = process.env.TRANSACTIONS_TABLE_NAME;

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
    const response = {
        headers: {        
            'Access-Control-Allow-Headers' : 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET'
        }
    }
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        let params = {
            TableName: HoldingsTableName,
            Key: {
                id: {
                    S: event.multiValueQueryStringParameters.id[0]
                }
            }
        };
        const holdingGetData = await dbClient.getItem(params).promise();

        params = {
            TableName: TickersTableName,
            Key: {
                id: {
                    S: holdingGetData.Item.tickerId.S
                }
            }
        }
        const tickerGetData = await dbClient.getItem(params).promise();

        params = {
            TableName: TickerPricesTableName,
            IndexName: 'TickerPricesByTickerIDIndex',
            ExpressionAttributeValues: {
                ':t': {S: holdingGetData.Item.tickerId.S}
            },
            KeyConditionExpression: 'tickerId = :t'
        }
        const tickerPricesGetData = await dbClient.query(params).promise();

        params = {
            TableName: TransactionsTableName,
            IndexName: 'TransactionByHoldingIDIndex',
            ExpressionAttributeValues: {
                ':h': {S: holdingGetData.Item.id.S}
            },
            KeyConditionExpression: 'holdingId = :h'
        }
        const transactionsGetData = await dbClient.query(params).promise();
        
        const responseData = {
            'holding': holdingGetData,
            'ticker': tickerGetData,
            'tickerPrices': tickerPricesGetData,
            'transactions': transactionsGetData
        }

        response.statusCode = 200;
        response.body = JSON.stringify(responseData);

    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
