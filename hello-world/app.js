const AWS = require("aws-sdk");
// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

// let dynamoDbClient
// const makeClient = () => {
//     const options = {
//         region: 'eu-west-2'
//     }
//     if(process.env.AWS_SAM_LOCAL) {
//         console.log('AWS_SAM_LOCAL env var set. using local dynamodb endpoint");
//         options.endpoint = 'http://dynamodb:8000';
//     }

// }


exports.lambdaHandler = async (event, context) => {
    console.log('Here');
    if(process.env.AWS_SAM_LOCAL) {
        console.log('test');
    }
    try {
        // const ret = await axios(url);
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world s',
                // location: ret.data.trim()
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};
