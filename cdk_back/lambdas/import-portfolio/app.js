const AWS = require('aws-sdk');
AWS.config.region = "eu-west-2";
const lambda = new AWS.Lambda();

const CreateHoldingFunction = process.env.CreateHoldingFunctionName;
const CreateTransactionFunction = process.env.CreateTransactionFunctionName;

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

        console.log(requestData.portfolio);

        let params = {
            FunctionName: CreateHoldingFunction,
            InvocationType: "RequestResponse",
            LogType: "Tail",
            Payload: `{ "body": "{ \\"coinId\\": \\"bitcoin\\", \\"accountId\\": \\"${accountId}\\" }" }`,
        };
        console.log(params);
        const data = await lambda.invoke(params).promise();
        console.log("Function successfully called");
        console.log(data);

        await requestData.portfolio.map(async (holding) => {
            let params = {
                FunctionName: CreateHoldingFunction,
                InvokeArgs: `{ "body": "{ \\"coinId\\": \\"${holding.coinID}\\", \\"accountId\\": \\"${accountId}\\" }" }`,
            };
            console.log(params);
            // const data = await lambda.invoke(params).promise();
            // console.log("Function successfully called");
            // console.log(data);

            // await holding.transactions.map(async (transaction) => {
            //     let txParams = {
            //         FunctionName: CreateTransactionFunction,
            //         InvokeArgs: `{ "body": "{ \\"holdingId\\": \\"${holding.coinID}\\", \\"accountId\\": \\"${accountId}\\" }" }`,
            //     }
            // })
    

        });

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
