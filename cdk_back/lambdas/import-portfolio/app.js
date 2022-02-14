const AWS = require('aws-sdk');
AWS.config.region = "eu-west-2";
const lambda = new AWS.Lambda();

const CreateHoldingFunction = process.env.CREATEHOLDINGNAME;

exports.handler = async (event, context) => {
    const response = {
        headers: {        
            'Access-Control-Allow-Headers' : 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        }
    }
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        let requestData = JSON.parse(event.body);
        let accountId = requestData['accountId'];

        let params = {
            FunctionName: CreateHoldingFunction,
            InvocationType: 'Event',
            LogType: 'Tail',
            Payload: `{ "body": "{ \\"coinId\\": \\"bitcoin\\", \\"accountId\\": \\"${accountId}\\" }" }`,
        };
        console.log(params);

        await lambda.invoke(params, (err, data) => {
            if (err) {
                throw err
            } else {
                console.log("Function successfully called");
                console.log(data);
            }
        }).promise();

        console.log("Complete")

        response.statusCode = 200;
        response.body = "Success";
    } catch (err) {
        console.log(err);
        response.statusCode = 500;
        response.body = err;
    }
    return response;
}
