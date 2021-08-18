const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
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
        request_data = JSON.parse(event.body);
        console.log('Received event:', JSON.stringify(event, null, 2));
        var params = {
            TableName: TickerTableName,
            Item: {
                'id': uuidv4(),
                'name': request_data.name,
                'symbol':  request_data.symbol,
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
