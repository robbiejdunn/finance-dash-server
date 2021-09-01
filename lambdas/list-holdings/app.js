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
    console.log(`Connecting to AWS DynamoDB at ${options.endpoint}`)
    dynamoDbClient = new AWS.DynamoDB(options);
    return dynamoDbClient;
};
const dbClient = makeClient()

let response;
exports.handler = async (event, context) => {
    try {
        console.log('test');
        const params = {
            TableName: HoldingsTableName,
            ProjectionExpression: 'id, #n, symbol, units, currentPrice',
            ExpressionAttributeNames: {
                '#n': 'name'
            }
        };
        console.log(`Scanning dynamodb table ${params.TableName}`);
        const data = await dbClient.scan(params, function(err, data) {
            if(err) {
                throw err;
            } else {
                console.log(data)
            }
        }).promise();
        console.log('Returning response with COR headers');
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
