# finance-dash-server

AWS SAM template & lambda nodejs images.

## Usage

### Development

Create docker network for local lambda development:

`docker network create lambda-local`

Run local dynamodb docker container on the created network:

`docker run --rm -p 8000:8000 --name dynamodblocal --network lambda-local amazon/dynamodb-local:latest`

Create the dynamodb table:

`aws dynamodb create-table --endpoint-url http://localhost:8000 --table-name TickerTable --attribute-definitions AttributeName=id,AttributeType=S --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --key-schema AttributeName=id,KeyType=HASH`

Use `nodemon` npm package to watch for file changes to support hot reloading (until docker volumes are added!). Run from project root:

`nodemon --exec sam build`

Start local lambda development containers:

`sam local start-api --debug --docker-network lambda-local`

Go to <http://127.0.0.1:3000/hello>. Reload the page to see code changes.
