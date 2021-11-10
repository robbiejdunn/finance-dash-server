# finance-dash-server

Backend lambdas and CDK stack for portfolio tracking web app. Repository for app frontend https://github.com/robbiejdunn/finance-dash.

## Usage

### Development

Start localstack services with docker-compose:

`docker-compose up`

Bootstrap localstack environment:

`cdklocal bootstrap`

Deply CDK stack locally:

`cdklocal deploy`

### AWS Deployment

Bootstrap AWS if not done already:

`cdk bootstrap`

Deploy stack to AWS:

`cdk deploy`
