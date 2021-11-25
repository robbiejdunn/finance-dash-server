import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { App, Stack, StackProps } from '@aws-cdk/core';

export class FinanceDashStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const siteBucket = new Bucket(this, 'SiteBucket', {
            websiteIndexDocument: 'index.html',
            publicReadAccess: true
        });

        new BucketDeployment(this, 'DeploySite', {
            sources: [Source.asset('../app/build')],
            destinationBucket: siteBucket
        });
    }
}
