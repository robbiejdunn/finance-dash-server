# finance-dash-server

Investment portfolio tracking single page web application. Uses React with a materialui (mui) design, and deploys to AWS using CDK IaC.

[![Push](https://github.com/robbiejdunn/finance-dash-server/actions/workflows/push.yml/badge.svg)](https://github.com/robbiejdunn/finance-dash-server/actions/workflows/push.yml)

## Usage

### Development

Start localstack services with docker-compose:

`docker-compose up`

Bootstrap localstack environment:

`cdklocal bootstrap`

Deply backend CDK stack locally:

`cd cdk_back && cdklocal deploy`

Run frontend against local services:

`scripts/start_local.sh`

To use dynamodb-admin web interface:

`DYNAMO_ENDPOINT=http://localhost:4566 dynamodb-admin`

### AWS Deployment

Bootstrap AWS if not done already:

`cdk bootstrap`

Deploy backend stack to AWS:

`cd cdk_back && cdk deploy`

Build frontend static content:

`scripts/build.sh`

Deploy frontend stack to AWS:

`cd cdk_front && cdk deploy`
