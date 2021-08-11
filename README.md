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
