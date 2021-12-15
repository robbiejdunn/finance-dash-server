#!/bin/bash

# npm install backend CDK deps
cd cdk_back && npm install

# npm install lambda deps
cd lambdas
for D in *; do
    if [ -d "${D}" ]; then
        cd "${D}" && npm install && cd ..
    fi
done

# deploy backend stack
cd .. && cdk deploy && cd ..

# install react app deps
npm install

# grab backend API endpoint using AWS CLI and build react app
API_ENDPOINT=$(
    aws cloudformation describe-stacks \
        --stack-name FinanceDashServerStack \
        --query "Stacks[0].Outputs[?ExportName=='FinanceDashAPIEndpoint'].OutputValue" \
        --output text
)
REACT_APP_FINANCE_DASH_API_ENDPOINT=$API_ENDPOINT npm run build

# deploy backend stack
cd cdk_front && npm install && cdk deploy && cd ..
