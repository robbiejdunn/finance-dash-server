import { Cors, LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Code, Function, Runtime, Tracing } from '@aws-cdk/aws-lambda';
import { Bucket, IBucket } from '@aws-cdk/aws-s3';
import { App, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { strict } from 'assert';

export class FinanceDashServerStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);
        
        // Ticker DDB table
        const tickerTable = new Table(this, 'TickerTable', {
            partitionKey: {name: 'id', type: AttributeType.STRING},
            // sortKey: {name: 'name', type: AttributeType.STRING},
            /**
            *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
            * the new table, and it will remain in your account until manually deleted. By setting the policy to
            * DESTROY, cdk destroy will delete the table (even if it has data in it)
            */
            removalPolicy: RemovalPolicy.DESTROY // NOT recommended for production code
        });

        const tickerPriceTable = new Table(this, 'TickerPriceTable', {
            // partitionKey: {name: 'tickerId', type: AttributeType.STRING},
            partitionKey: {name: 'id', type: AttributeType.STRING},
            removalPolicy: RemovalPolicy.DESTROY
        });
        tickerPriceTable.addGlobalSecondaryIndex({
            indexName: 'TickerPricesByTickerIDIndex',
            partitionKey: {name: 'tickerId', type: AttributeType.STRING},
        });

        const localBucket = Bucket.fromBucketName(this, 's3local', '__local__');
        
        const createTickerFunction = new Function(this, 'CreateTickerFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode('/home/robbie/dev/aws/finance-dash-server/lambdas/create-ticker', 'lambdas/create-ticker', localBucket),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName
            }
        });

        const listTickersFunction = new Function(this, 'ListTickersFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode('/home/robbie/dev/aws/finance-dash-server/lambdas/list-tickers', 'lambdas/list-tickers', localBucket),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName
            }
        });

        const getTickerFunction = new Function(this, 'GetTickerFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode('/home/robbie/dev/aws/finance-dash-server/lambdas/get-ticker', 'lambdas/get-ticker', localBucket),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName
            }
        });

        const createTickerPriceFunction = new Function(this, 'CreateTickerPriceFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode('/home/robbie/dev/aws/finance-dash-server/lambdas/create-ticker-price', 'lambdas/create-ticker-price', localBucket),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_PRICE_TABLE_NAME': tickerPriceTable.tableName
            }
        })

        const getTickerPricesByTickerIdFunction = new Function(this, 'GetTickerPricesByTickerIdFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode('/home/robbie/dev/aws/finance-dash-server/lambdas/get-ticker-prices-by-ticker-id', 'lambdas/get-ticker-prices-by-ticker-id', localBucket),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_PRICE_TABLE_NAME': tickerPriceTable.tableName
            }
        })

        tickerTable.grantWriteData(createTickerFunction);
        tickerTable.grantReadData(listTickersFunction);
        tickerTable.grantReadData(getTickerFunction);
        tickerPriceTable.grantWriteData(createTickerPriceFunction);
        tickerPriceTable.grantReadData(getTickerPricesByTickerIdFunction)

        const createTickerIntegration = new LambdaIntegration(createTickerFunction);
        const listTickersIntegration = new LambdaIntegration(listTickersFunction);
        const getTickerIntegration = new LambdaIntegration(getTickerFunction);
        const createTickerPriceIntegration = new LambdaIntegration(createTickerPriceFunction);
        const getTickerPricesByTickerIdIntegration = new LambdaIntegration(getTickerPricesByTickerIdFunction);

        const api = new RestApi(this, 'FinanceDashAPI', {
            restApiName: 'Finance Dash Service',
            endpointExportName: 'FinanceDashAPIEndpoint',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS
            },
        });

        const tickersApiResource = api.root.addResource('tickers');
        tickersApiResource.addMethod('GET', getTickerIntegration);
        tickersApiResource.addMethod('POST', createTickerIntegration);

        const tickersListApiResource = tickersApiResource.addResource('list');
        tickersListApiResource.addMethod('GET', listTickersIntegration);

        const tickersPriceApiResource = api.root.addResource('tickersPrice');
        tickersPriceApiResource.addMethod('POST', createTickerPriceIntegration);
        tickersPriceApiResource.addMethod('GET', getTickerPricesByTickerIdIntegration);
    }

    private getLambdaCode(local_fp: string, asset_p: string, localBucket: IBucket): Code {
        if(process.env['_'] && process.env['_'].split('/').pop() === 'cdklocal') {
            console.log(`Using local mount with fp ${local_fp}`);
            return Code.fromBucket(localBucket, local_fp);
        } else {
            console.log('Using CDK asset');
            return Code.fromAsset(asset_p);
        }
    }
}
