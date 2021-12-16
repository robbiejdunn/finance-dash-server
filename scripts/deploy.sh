#!/bin/bash

# exit when any command fails
set -e

echo "Select deploy type: a = all stacks (both backend and frontend), b = only backend, f = only frontend"
read DEPLOY_TYPE

if [[ "$DEPLOY_TYPE" == "b" ]] || [[ "$DEPLOY_TYPE" == "a" ]]; then
    # npm install backend CDK deps
    cd cdk_back && npm install

    # npm install lambda deps
    cd lambdas
    for D in *; do
        if [[ -d "${D}" ]]; then
            cd "${D}" && npm install && cd ..
        fi
    done

    # deploy backend stack
    cd .. && cdk deploy && cd ..
fi

if [[ "$DEPLOY_TYPE" == "f" ]] || [[ "$DEPLOY_TYPE" == "a" ]]; then
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

    # deploy frontend stack
    cd cdk_front && npm install && cdk deploy && cd ..
fi
