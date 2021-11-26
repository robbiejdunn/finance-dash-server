const AWS = require('aws-sdk'); 
var response = require('cfn-response');
const { v4: uuidv4 } = require('uuid')
// const { Client } = require('pg')

const HoldingsTableName = process.env.HOLDINGS_TABLE_NAME;

// TODO: move to utils / shared location
const makeClient = () => {
    const options = {
        region: 'eu-west-2'
    };
    if(process.env.LOCALSTACK_HOSTNAME) {
        options.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
    }
    const dynamoDbClient = new AWS.DynamoDB(options);
    return dynamoDbClient;
};
const dbClient = makeClient();

exports.handler = (event, context) => {
    let params = {
        TableName: HoldingsTableName,
        Item: {
            'id': {
                S: uuidv4()
            },
            'name': {
                S: "Bitcoin"
            },
            'symbol': {
                S: "BTC"
            },
            'units': {
                N: '0'
            },
            'currentPrice': {
                N: "34000"
            },
            'tickerId': {
                S: "TEST"
            },
            'marketValue': {
                N: '0'
            },
            'twentyFourHourChange': {
                N: "0"
            },
            'marketCap': {
                N: "240"
            },
            'volume': {
                N: "100"
            }
        }
    }
    dbClient.putItem(params);
    console.log(event);
    console.log("new log");
    return response.send(event, context, response.FAILED, {});
};
