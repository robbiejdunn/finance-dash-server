import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { App, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { Distribution } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { RetentionDays } from '@aws-cdk/aws-logs';

export class FinanceDashStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const siteBucket = new Bucket(this, 'SiteBucket', {
            websiteIndexDocument: 'index.html',
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
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
    }
}
