# finance-dash-server

AWS SAM template & lambda nodejs images.

## Requirements

- Nodejs
- Docker
- sam-beta-cdk
- cdklocal

## Usage

### Development

Run localstack docer-compose:

`docker-compose up`

Bootstrap cdklocal:

`cdklocal bootstrap`

Deply CDK stack locally:

`LAMBDA_MOUNT_CODE=true cdklocal deploy`

Use `awslocal` CLI commands or web requests to interact with the services.

### Deployment

Build and synth lambdas:

`sam-beta-cdk build`

Deploy:

`cdk deploy`

### Getting localstack API gateway URL

TODO: make this easier (env vars?)

With localstack running get the API ID:

`awslocal apigateway get-rest-apis`

The URL for local testing will be in the form localhost:4566/restapis/<api id>/prod/_user_requests_/Tickers