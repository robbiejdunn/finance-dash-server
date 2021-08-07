const { v4: uuidv4 } = require('uuid');
const db_connector = require('./db-client.js');

exports.putTickerHandler = async (event, context) => {
    try {
        db_doc_client = db_connector.connect();
        var params = {
            TableName: 'TickerTable',
            Item: {
                'id': uuidv4(),
                'Name': 'ETC-GBP'
            }
        };
        console.log(`Putting item in DynamoDB table ${params.TableName}`);
        try {
            const data = await db_doc_client.put(params).promise();
            console.log('Success:', data);
        } catch (err) {
            console.log('Failure:', err.message, err.stack);
        }
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: `Ticker created with id=${params.Item.id} Name=${params.Item.Name}`
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }
    return response
};
