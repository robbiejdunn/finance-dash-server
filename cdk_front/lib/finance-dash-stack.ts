import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { App, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { Distribution } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { RetentionDays } from '@aws-cdk/aws-logs';
import * as cog from '@aws-cdk/aws-cognito';

export class FinanceDashStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const siteBucket = new Bucket(this, 'SiteBucket', {
            websiteIndexDocument: 'index.html',
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        const distribution = new Distribution(this, 'CloudDist', {
            defaultBehavior: { origin: new S3Origin(siteBucket) },
        });

        new BucketDeployment(this, 'DeploySite', {
            sources: [Source.asset('../build')],
            destinationBucket: siteBucket,
            distribution,
            logRetention: RetentionDays.ONE_WEEK,
        });

        const userPool = new cog.UserPool(this, 'UserPool', {
            accountRecovery: cog.AccountRecovery.EMAIL_ONLY,
            deviceTracking: {
                challengeRequiredOnNewDevice: false,
                deviceOnlyRememberedOnUserPrompt: false,
            },
            enableSmsRole: false,
        });

        const userPoolClient = userPool.addClient('UserPoolClient', {
            oAuth: {
                flows: {
                    implicitCodeGrant: true,
                },
                callbackUrls: [
                    `https://${distribution.domainName}/dashboard`
                ]
            },
        });

        const domain = userPool.addDomain('UserPoolDomain', {
            cognitoDomain: {
                domainPrefix: 'finance-dash-server'
            }
        });

        const signInUrl = domain.signInUrl(userPoolClient, {
            redirectUri: `https://${distribution.domainName}/dashboard`
        });
    }
}
