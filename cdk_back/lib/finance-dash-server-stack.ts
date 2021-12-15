import { Cors, LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { Code, Function, Runtime, Tracing } from '@aws-cdk/aws-lambda';
import { Bucket, IBucket } from '@aws-cdk/aws-s3';
import { App, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { strict } from 'assert';
import { Topic } from '@aws-cdk/aws-sns';
import { LambdaSubscription } from '@aws-cdk/aws-sns-subscriptions';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { CustomResource } from '@aws-cdk/core';
import { Provider } from '@aws-cdk/custom-resources';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';

export class FinanceDashServerStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'VPC', {
            cidr: '10.0.0.0/24',
            maxAzs: 2,
            natGateways: 0,
            subnetConfiguration: [
                {
                    // cidrMask: 24,
                    name: 'public',
                    subnetType: ec2.SubnetType.PUBLIC,
                }
            ],
        });

        const postgresSecurityGroup = new ec2.SecurityGroup(this, 'Postgres Security Group', {
            vpc,
            description: 'Allow all incoming access',
            allowAllOutbound: true,
        });

        const postgresDB = new rds.DatabaseInstance(this, 'Postgres DB', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_12_8,
            }),
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T2,
                ec2.InstanceSize.MICRO
            ),
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            },
            allocatedStorage: 20,
            backupRetention: Duration.days(0),
            cloudwatchLogsRetention: RetentionDays.ONE_WEEK,
            multiAz: false,
            removalPolicy: RemovalPolicy.DESTROY,
            credentials: rds.Credentials.fromGeneratedSecret('postgres'),
            securityGroups: [postgresSecurityGroup],
        });

        postgresSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(5432),
            'Allow all incoming access'
        );

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
            partitionKey: {name: 'id', type: AttributeType.STRING},
            removalPolicy: RemovalPolicy.DESTROY
        });
        
        tickerPriceTable.addGlobalSecondaryIndex({
            indexName: 'TickerPricesByTickerIDIndex',
            partitionKey: {name: 'tickerId', type: AttributeType.STRING},
            sortKey: {name: 'datetime', type: AttributeType.STRING}
        });

        const transactionTable = new Table(this, 'TransactionTable', {
            partitionKey: {name: 'id', type: AttributeType.STRING},
            removalPolicy: RemovalPolicy.DESTROY
        })

        transactionTable.addGlobalSecondaryIndex({
            indexName: 'TransactionByHoldingIDIndex',
            partitionKey: {name: 'holdingId', type: AttributeType.STRING},
            sortKey: {name: 'datetime', type: AttributeType.STRING}
        })

        const holdingsTable = new Table(this, 'HoldingsTable', {
            partitionKey: {name: 'id', type: AttributeType.STRING},
            removalPolicy: RemovalPolicy.DESTROY,
        })

        // this is for mounting code when running with localstack
        // const localBucket = Bucket.fromBucketName(this, 's3local', 'local');

        const initDBFunction = new Function(this, 'InitDBFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/init-db'),
            timeout: Duration.minutes(10),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
        });

        const getHoldingFunction = new Function(this, 'GetHoldingFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/get-holding'),
            timeout: Duration.seconds(10),
            environment: {
                'HOLDINGS_TABLE_NAME': holdingsTable.tableName,
                'TICKERS_TABLE_NAME': tickerTable.tableName,
                'TICKER_PRICES_TABLE_NAME': tickerPriceTable.tableName,
                'TRANSACTIONS_TABLE_NAME': transactionTable.tableName
            },
            logRetention: RetentionDays.ONE_WEEK,
        });

        const createTickerPricesCronFunction = new Function(this, 'CreateTickerPricesCronFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/create-ticker-prices-cron'),
            timeout: Duration.seconds(120),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
        });

        const listHoldingsFunction = new Function(this, 'ListHoldingsFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/list-holdings'),
            timeout: Duration.seconds(10),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
        });
        
        const createTransactionFunction = new Function(this, 'CreateTransactionFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/create-transaction'),
            timeout: Duration.seconds(10),
            environment: {
                'TRANSACTIONS_TABLE_NAME': transactionTable.tableName,
                'HOLDINGS_TABLE_NAME': holdingsTable.tableName,
            },
            logRetention: RetentionDays.ONE_WEEK,
        });

        const getPortfolioFullFunction = new Function(this, 'GetPortfolioFullFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/get-portfolio-full'),
            timeout: Duration.seconds(10),
            environment: {
                'HOLDINGS_TABLE_NAME': holdingsTable.tableName,
                'TRANSACTIONS_TABLE_NAME': transactionTable.tableName,
                'TICKER_PRICES_TABLE_NAME': tickerPriceTable.tableName,
                'TICKERS_TABLE_NAME': tickerTable.tableName,
            },
            logRetention: RetentionDays.ONE_WEEK,
        });

        const getCoinHistoricalFunction = new Function(this, 'GetCoinHistoricalFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/get-coin-historical'),
            timeout: Duration.seconds(120),
            environment: {
                'TICKER_PRICES_TABLE_NAME': tickerPriceTable.tableName,
            },
            logRetention: RetentionDays.ONE_WEEK,
        });

        const historicalDataTopic = new Topic(this, 'HistoricalDataTopic', {
            displayName: 'Historical data topic',
        });

        // historicalDataTopic.addSubscription(new LambdaSubscription(getCoinHistoricalFunction));

        const createHoldingFunction = new Function(this, 'CreateHoldingFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/create-holding'),
            timeout: Duration.seconds(10),
            environment: {
                'TICKERS_TABLE_NAME': tickerTable.tableName,
                'HOLDINGS_TABLE_NAME': holdingsTable.tableName,
                'HISTORICAL_TOPIC_ARN': historicalDataTopic.topicArn,
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
        });

        historicalDataTopic.grantPublish(createHoldingFunction);

        tickerTable.grantWriteData(createHoldingFunction);
        tickerTable.grantReadData(getHoldingFunction);
        tickerTable.grantReadData(getPortfolioFullFunction);

        tickerPriceTable.grantWriteData(getCoinHistoricalFunction);
        tickerPriceTable.grantReadData(getHoldingFunction);
        tickerPriceTable.grantReadData(getPortfolioFullFunction);

        holdingsTable.grantWriteData(createHoldingFunction);
        holdingsTable.grantWriteData(createTransactionFunction);
        holdingsTable.grantReadData(getHoldingFunction);
        holdingsTable.grantReadData(getPortfolioFullFunction);

        transactionTable.grantWriteData(createTransactionFunction);
        transactionTable.grantReadData(getHoldingFunction);
        transactionTable.grantReadData(getPortfolioFullFunction);

        const createTickerPricesCronTarget = new LambdaFunction(createTickerPricesCronFunction)

        new Rule(this, 'CreateTickerPricesCronRule', {
            schedule: Schedule.cron({minute: '0/10'}),
            targets: [createTickerPricesCronTarget]
        });

        const dbInitProvider = new Provider(this, 'DBInitProvider', {
            onEventHandler: initDBFunction,
            logRetention: RetentionDays.ONE_WEEK,
        })
        new CustomResource(this, 'DBInitResource', { serviceToken: dbInitProvider.serviceToken })

        const createHoldingIntegration = new LambdaIntegration(createHoldingFunction);
        const listHoldingsIntegration = new LambdaIntegration(listHoldingsFunction);
        const getHoldingIntegration = new LambdaIntegration(getHoldingFunction);
        const createTransactionIntegration = new LambdaIntegration(createTransactionFunction);
        const getPortfolioFullIntegration = new LambdaIntegration(getPortfolioFullFunction);

        const api = new RestApi(this, 'FinanceDashAPI', {
            restApiName: 'Finance Dash Service',
            endpointExportName: 'FinanceDashAPIEndpoint',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS
            },
        });

        const holdingsApiResource = api.root.addResource('holdings');
        holdingsApiResource.addMethod('POST', createHoldingIntegration);
        holdingsApiResource.addMethod('GET', getHoldingIntegration);

        const holdingsListApiResource = holdingsApiResource.addResource('list');
        holdingsListApiResource.addMethod('GET', listHoldingsIntegration);

        const transactionsApiResource = api.root.addResource('transactions');
        transactionsApiResource.addMethod('POST', createTransactionIntegration);

        const portfolioApiResource = api.root.addResource('portfolio');
        portfolioApiResource.addMethod('GET', getPortfolioFullIntegration);
    }
}
