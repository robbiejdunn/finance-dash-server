# finance-dash-server

Backend lambdas and CDK stack for portfolio tracking web app. Repository for app frontend https://github.com/robbiejdunn/finance-dash.

[![Push](https://github.com/robbiejdunn/finance-dash-server/actions/workflows/push.yml/badge.svg)](https://github.com/robbiejdunn/finance-dash-server/actions/workflows/push.yml)

## Usage

### Development

Start localstack services with docker-compose:

`docker-compose up`

Bootstrap localstack environment:

`cdklocal bootstrap`

Deply CDK stack locally:

`cdklocal deploy`

To use dynamodb-admin web interface:

`DYNAMO_ENDPOINT=http://localhost:4566 dynamodb-admin`

### AWS Deployment

Bootstrap AWS if not done already:

`cdk bootstrap`

Deploy stack to AWS:

`cdk deploy`
