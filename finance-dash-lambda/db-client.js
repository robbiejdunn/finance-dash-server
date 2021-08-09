const AWS = require('aws-sdk');

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
}

module.exports = {
    connect: () => dynamoDbClient || makeClient()
}
