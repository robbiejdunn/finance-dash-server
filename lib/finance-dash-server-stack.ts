import { LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Code, Function, Runtime, Tracing } from '@aws-cdk/aws-lambda';
import { App, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';

export class FinanceDashServerStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        // Ticker DDB table
        const tickerTable = new Table(this, 'TickerTable', {
            partitionKey: {name: 'id', type: AttributeType.STRING},
            sortKey: {name: 'name', type: AttributeType.STRING},
            /**
            *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
            * the new table, and it will remain in your account until manually deleted. By setting the policy to
            * DESTROY, cdk destroy will delete the table (even if it has data in it)
            */
            removalPolicy: RemovalPolicy.DESTROY // NOT recommended for production code
        });

        // Put ticker lambda function
        // TODO: what does tracing do
        const createTickerFunction = new Function(this, 'CreateTickerFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/create-ticker'),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName
            }
        });

        tickerTable.grantWriteData(createTickerFunction);

        const createTickerIntegration = new LambdaIntegration(createTickerFunction);

        const api = new RestApi(this, 'TickersApi', {
            restApiName: 'Tickers Service'
        });

        const tickers = api.root.addResource('Tickers');
        tickers.addMethod('GET', createTickerIntegration);
    }
}
