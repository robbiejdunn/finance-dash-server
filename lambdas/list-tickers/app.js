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
    dynamoDbClient = new AWS.DynamoDB.DocumentClient(options);
    return dynamoDbClient;
};
const dbClient = makeClient()

let response;
exports.handler = async (event, context) => {
    try {
        var params = {
            TableName: TickerTableName
        };
        const data = await dbClient.scan(params).promise();
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
