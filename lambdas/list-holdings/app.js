const AWS = require('aws-sdk');
const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;

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
        const params = {
            TableName: HoldingsTableName,
            ProjectionExpression: 'id, #n, symbol, units, currentPrice, marketValue',
            ExpressionAttributeNames: {
                '#n': 'name'
            }
        };
        const data = await dbClient.scan(params).promise();
        response.statusCode = 200;
        response.body = JSON.stringify(data);
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
};
