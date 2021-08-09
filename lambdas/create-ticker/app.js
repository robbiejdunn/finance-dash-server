const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const TickerTableName = process.env.TICKER_TABLE

// TODO: move to utils / shared location
let dynamoDbClient;
const makeClient = () => {
    const options = {
        region: 'eu-west-2'
    };
    if(process.env.AWS_SAM_LOCAL) {
        console.log('AWS_SAM_LOCAL env var set. using local dynamodb endpoint');
        options.endpoint = 'http://dynamodblocal:8000';
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
        var params = {
            TableName: TickerTableName,
            Item: {
                'id': uuidv4(),
                'name': 'ETC-GBP'
            }
        };
        console.log(`Putting item in DynamoDB table ${params.TableName}`);
        try {
            const data = await dbClient.put(params).promise();
            console.log('Success:', data);
        } catch (err) {
            console.log('Failure:', err.message, err.stack);
        }
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: `Ticker created with id=${params.Item.id} Name=${params.Item.Name}`
            })
        };
    } catch (err) {
        console.log(err);
        return err;
    }
    return response;
};
