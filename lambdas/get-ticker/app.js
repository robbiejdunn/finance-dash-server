const AWS = require('aws-sdk');
const TickerTableName = process.env.TICKER_TABLE

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
// module.exports = {
//     connect: () => dynamoDbClient || makeClient()
// }

let response;
exports.handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        console.log(event.multiValueQueryStringParameters);
        console.log(event.multiValueQueryStringParameters.id);
        console.log(event.multiValueQueryStringParameters.id[0]);
        var params = {
            TableName: TickerTableName,
            Key: {
                id: event.multiValueQueryStringParameters.id[0]
            }
        };
        const data = await dbClient.get(params).promise();
        response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Headers' : 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            body: JSON.stringify(data)
        };
    } catch (err) {
        console.log(err);
        return err;
    }
    return response;
};
