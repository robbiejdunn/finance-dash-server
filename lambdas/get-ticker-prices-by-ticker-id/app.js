const AWS = require('aws-sdk');
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

exports.handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));

        var params = {
            TableName: TickerPriceTableName,
            IndexName: 'TickerPricesByTickerIDIndex',
            ExpressionAttributeValues: {
                ':t': {S: event.multiValueQueryStringParameters.tickerId[0]}
            },
            KeyConditionExpression: 'tickerId = :t'
        }
        console.log(params);
        console.log(`Querying DynamoDB table ${params.TableName}`);
        data = await dbClient.query(params).promise();

        response.statusCode = 200;
        response.body = JSON.stringify(data);
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
