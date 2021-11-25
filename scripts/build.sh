#!/bin/bash

API_ENDPOINT=$(
    aws cloudformation describe-stacks \
        --stack-name FinanceDashServerStack \
        --query "Stacks[0].Outputs[?ExportName=='FinanceDashAPIEndpoint'].OutputValue" \
        --output text
)
REACT_APP_FINANCE_DASH_API_ENDPOINT=$API_ENDPOINT npm run build
