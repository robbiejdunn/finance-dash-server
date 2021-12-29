import { Cors, LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { Architecture, Code, Function, Runtime } from '@aws-cdk/aws-lambda';
import { App, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { CustomResource } from '@aws-cdk/core';
import { Provider } from '@aws-cdk/custom-resources';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';

export class FinanceDashServerStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        // although this is fine for now, it should eventually be placed in a 
        // private / isolated VPC subnet
        const vpc = new ec2.Vpc(this, 'VPC', {
            cidr: '10.0.0.0/24',
            maxAzs: 2,
            natGateways: 0,
            subnetConfiguration: [
                {
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
            // this version or below is required to run pg T2 micro instances
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
            architecture: Architecture.ARM_64,
        });

        const getHoldingFunction = new Function(this, 'GetHoldingFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/get-holding'),
            timeout: Duration.seconds(10),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
            architecture: Architecture.ARM_64,
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
            architecture: Architecture.ARM_64,
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
            architecture: Architecture.ARM_64,
        });
        
        const createTransactionFunction = new Function(this, 'CreateTransactionFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/create-transaction'),
            timeout: Duration.seconds(10),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
            architecture: Architecture.ARM_64,
        });

        const getPortfolioFullFunction = new Function(this, 'GetPortfolioFullFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/get-portfolio-full'),
            timeout: Duration.seconds(10),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
            architecture: Architecture.ARM_64,
        });

        const createHoldingFunction = new Function(this, 'CreateHoldingFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/create-holding'),
            timeout: Duration.minutes(2),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
            architecture: Architecture.ARM_64,
        });

        const deleteTransactionsFunction = new Function(this, 'DeleteTransactionsFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/delete-transactions'),
            timeout: Duration.minutes(1),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
            architecture: Architecture.ARM_64,
        });

        const deleteHoldingsFunction = new Function(this, 'DeleteHoldingsFunction', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('lambdas/delete-holdings'),
            timeout: Duration.minutes(1),
            environment: {
                'PGUSER': postgresDB.secret?.secretValueFromJson('username').toString()!,
                'PGHOST': postgresDB.secret?.secretValueFromJson('host').toString()!,
                'PGPASSWORD': postgresDB.secret?.secretValueFromJson('password').toString()!,
                'PGDATABASE': 'financedashdb',
                'PGPORT': '5432',
            },
            logRetention: RetentionDays.ONE_WEEK,
            architecture: Architecture.ARM_64,
        });

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
        const deleteTransactionsIntegration = new LambdaIntegration(deleteTransactionsFunction);
        const deleteHoldingsIntegration = new LambdaIntegration(deleteHoldingsFunction);

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
        const holdingsDeleteAR = holdingsApiResource.addResource('delete');
        holdingsDeleteAR.addMethod('POST', deleteHoldingsIntegration);
        const holdingsListApiResource = holdingsApiResource.addResource('list');
        holdingsListApiResource.addMethod('GET', listHoldingsIntegration);

        const transactionsApiResource = api.root.addResource('transactions');
        transactionsApiResource.addMethod('POST', createTransactionIntegration);
        const txDeleteAR = transactionsApiResource.addResource('delete');
        txDeleteAR.addMethod('POST', deleteTransactionsIntegration);

        const portfolioApiResource = api.root.addResource('portfolio');
        portfolioApiResource.addMethod('GET', getPortfolioFullIntegration);
    }
}
