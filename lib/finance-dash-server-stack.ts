import { Cors, LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
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
            sortKey: {name: 'datetime', type: AttributeType.STRING},
        });

        const holdingsTable = new Table(this, 'HoldingsTable', {
            partitionKey: {name: 'id', type: AttributeType.STRING},
            removalPolicy: RemovalPolicy.DESTROY,
        })

        // this is for mounting code when running with localstack
        const localBucket = Bucket.fromBucketName(this, 's3local', '__local__');
        
        const createTickerFunction = new Function(this, 'CreateTickerFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/create-ticker', 
                'lambdas/create-ticker', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName
            }
        });

        const listTickersFunction = new Function(this, 'ListTickersFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/list-tickers', 
                'lambdas/list-tickers', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName
            }
        });

        const getHoldingFunction = new Function(this, 'GetHoldingFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/get-holding', 
                'lambdas/get-holding', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'HOLDINGS_TABLE_NAME': holdingsTable.tableName,
                'TICKERS_TABLE_NAME': tickerTable.tableName,
                'TICKER_PRICES_TABLE_NAME': tickerPriceTable.tableName
            }
        });

        const createTickerPriceFunction = new Function(this, 'CreateTickerPriceFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/create-ticker-price', 
                'lambdas/create-ticker-price', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_PRICE_TABLE_NAME': tickerPriceTable.tableName
            }
        })

        const getTickerPricesByTickerIdFunction = new Function(this, 'GetTickerPricesByTickerIdFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/get-ticker-prices-by-ticker-id', 
                'lambdas/get-ticker-prices-by-ticker-id', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_PRICE_TABLE_NAME': tickerPriceTable.tableName
            }
        });

        const createTickerPricesCronFunction = new Function(this, 'CreateTickerPricesCronFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/create-ticker-prices-cron', 
                'lambdas/create-ticker-prices-cron', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName,
                'TICKER_PRICE_TABLE_NAME': tickerPriceTable.tableName
            }
        });

        const createHoldingFunction = new Function(this, 'CreateHoldingFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/create-holding', 
                'lambdas/create-holding', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'TICKERS_TABLE_NAME': tickerTable.tableName,
                'HOLDINGS_TABLE_NAME': holdingsTable.tableName
            }
        });

        const listHoldingsFunction = new Function(this, 'ListHoldingsFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: this.getLambdaCode(
                '/home/robbie/dev/aws/finance-dash-server/lambdas/list-holdings', 
                'lambdas/list-holdings', 
                localBucket
            ),
            timeout: Duration.seconds(10),
            environment: {
                'HOLDINGS_TABLE_NAME': holdingsTable.tableName
            }
        }) 

        tickerTable.grantWriteData(createTickerFunction);
        tickerTable.grantWriteData(createHoldingFunction);
        tickerTable.grantReadData(listTickersFunction);
        tickerTable.grantReadData(createTickerPricesCronFunction);
        tickerTable.grantReadData(getHoldingFunction);
        tickerPriceTable.grantWriteData(createTickerPriceFunction);
        tickerPriceTable.grantReadData(getTickerPricesByTickerIdFunction)
        tickerPriceTable.grantWriteData(createTickerPricesCronFunction);
        tickerPriceTable.grantReadData(getHoldingFunction);
        holdingsTable.grantWriteData(createHoldingFunction);
        holdingsTable.grantReadData(listHoldingsFunction);
        holdingsTable.grantReadData(getHoldingFunction);

        const createTickerPricesCronTarget = new LambdaFunction(createTickerPricesCronFunction)

        new Rule(this, 'CreateTickerPricesCronRule', {
            schedule: Schedule.cron({minute: '0/10'}),
            targets: [createTickerPricesCronTarget]
        });

        const createTickerIntegration = new LambdaIntegration(createTickerFunction);
        const listTickersIntegration = new LambdaIntegration(listTickersFunction);
        const createTickerPriceIntegration = new LambdaIntegration(createTickerPriceFunction);
        const getTickerPricesByTickerIdIntegration = new LambdaIntegration(getTickerPricesByTickerIdFunction);
        const createHoldingIntegration = new LambdaIntegration(createHoldingFunction);
        const listHoldingsIntegration = new LambdaIntegration(listHoldingsFunction);
        const getHoldingIntegration = new LambdaIntegration(getHoldingFunction);

        const api = new RestApi(this, 'FinanceDashAPI', {
            restApiName: 'Finance Dash Service',
            endpointExportName: 'FinanceDashAPIEndpoint',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS
            },
        });

        const tickersApiResource = api.root.addResource('tickers');
        tickersApiResource.addMethod('POST', createTickerIntegration);

        const tickersListApiResource = tickersApiResource.addResource('list');
        tickersListApiResource.addMethod('GET', listTickersIntegration);

        const tickersPriceApiResource = api.root.addResource('tickersPrice');
        tickersPriceApiResource.addMethod('POST', createTickerPriceIntegration);
        tickersPriceApiResource.addMethod('GET', getTickerPricesByTickerIdIntegration);

        const holdingsApiResource = api.root.addResource('holdings');
        holdingsApiResource.addMethod('POST', createHoldingIntegration);
        holdingsApiResource.addMethod('GET', getHoldingIntegration);

        const holdingsListApiResource = holdingsApiResource.addResource('list');
        holdingsListApiResource.addMethod('GET', listHoldingsIntegration);
    }

    private getLambdaCode(local_fp: string, asset_p: string, localBucket: IBucket): Code {
        if(process.env['_'] && process.env['_'].split('/').pop() === 'cdklocal') {
            return Code.fromBucket(localBucket, local_fp);
        } else {
            return Code.fromAsset(asset_p);
        }
    }
}
