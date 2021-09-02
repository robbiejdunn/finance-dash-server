const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const TransactionsTableName = process.env.TRANSACTIONS_TABLE_NAME;
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

let response;
exports.handler = async (event, context) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        requestData = JSON.parse(event.body);
        let params = {
            TableName: TransactionsTableName,
            Item: {
                'id': {
                    S: uuidv4()
                },
                'holdingId': {
                    S: requestData.holdingId
                },
                'datetime': {
                    S: new Date(requestData.datetime).toISOString()
                },
                'buySell': {
                    S: requestData.buySell
                },
                'units': {
                    N: requestData.units
                },
                'price': {
                    N: requestData.price
                }
            }
        }
        await dbClient.putItem(params).promise();
        params = {
            TableName: HoldingsTableName,
            Key: {
                'id': {
                    S: requestData.holdingId
                }
            },
            ExpressionAttributeValues: {
                ':increment': {
                    N: requestData.units
                }
            }
        }
        if(requestData.buySell === 'BUY') {
            params.UpdateExpression = 'SET units = units + :increment'
        } else {
            params.UpdateExpression = 'SET units = units - :increment'
        }
        console.log(params);
        await dbClient.updateItem(params).promise();
        response = {
            statusCode: 200,
            headers: {        
                'Access-Control-Allow-Headers' : 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: `Transaction created`
        };
        return response;
    } catch (err) {
        console.log(err);
        return err;
    }
};
