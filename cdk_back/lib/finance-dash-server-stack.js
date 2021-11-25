"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceDashServerStack = void 0;
const aws_apigateway_1 = require("@aws-cdk/aws-apigateway");
const aws_dynamodb_1 = require("@aws-cdk/aws-dynamodb");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const core_1 = require("@aws-cdk/core");
class FinanceDashServerStack extends core_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Ticker DDB table
        const tickerTable = new aws_dynamodb_1.Table(this, 'TickerTable', {
            partitionKey: { name: 'id', type: aws_dynamodb_1.AttributeType.STRING },
            sortKey: { name: 'name', type: aws_dynamodb_1.AttributeType.STRING },
            /**
            *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
            * the new table, and it will remain in your account until manually deleted. By setting the policy to
            * DESTROY, cdk destroy will delete the table (even if it has data in it)
            */
            removalPolicy: core_1.RemovalPolicy.DESTROY // NOT recommended for production code
        });
        // Put ticker lambda function
        // TODO: what does tracing do
        const createTickerFunction = new aws_lambda_1.Function(this, 'CreateTickerFunction', {
            runtime: aws_lambda_1.Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: aws_lambda_1.Code.fromAsset('lambdas/create-ticker'),
            timeout: core_1.Duration.seconds(10),
            environment: {
                'TICKER_TABLE': tickerTable.tableName
            }
        });
        tickerTable.grantWriteData(createTickerFunction);
        const createTickerIntegration = new aws_apigateway_1.LambdaIntegration(createTickerFunction);
        const api = new aws_apigateway_1.RestApi(this, 'TickersApi', {
            restApiName: 'Tickers Service'
        });
        const tickers = api.root.addResource('Tickers');
        tickers.addMethod('GET', createTickerIntegration);
    }
}
exports.FinanceDashServerStack = FinanceDashServerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluYW5jZS1kYXNoLXNlcnZlci1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZpbmFuY2UtZGFzaC1zZXJ2ZXItc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNERBQXFFO0FBQ3JFLHdEQUE2RDtBQUM3RCxvREFBdUU7QUFDdkUsd0NBQWdGO0FBRWhGLE1BQWEsc0JBQXVCLFNBQVEsWUFBSztJQUM3QyxZQUFZLEtBQVUsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDbEQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLElBQUksb0JBQUssQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQy9DLFlBQVksRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLDRCQUFhLENBQUMsTUFBTSxFQUFDO1lBQ3RELE9BQU8sRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLDRCQUFhLENBQUMsTUFBTSxFQUFDO1lBQ25EOzs7O2NBSUU7WUFDRixhQUFhLEVBQUUsb0JBQWEsQ0FBQyxPQUFPLENBQUMsc0NBQXNDO1NBQzlFLENBQUMsQ0FBQztRQUVILDZCQUE2QjtRQUM3Qiw2QkFBNkI7UUFDN0IsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLHFCQUFRLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQ3BFLE9BQU8sRUFBRSxvQkFBTyxDQUFDLFdBQVc7WUFDNUIsT0FBTyxFQUFFLGFBQWE7WUFDdEIsSUFBSSxFQUFFLGlCQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDO1lBQzdDLE9BQU8sRUFBRSxlQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUM3QixXQUFXLEVBQUU7Z0JBQ1QsY0FBYyxFQUFFLFdBQVcsQ0FBQyxTQUFTO2FBQ3hDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsV0FBVyxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRWpELE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxrQ0FBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRTVFLE1BQU0sR0FBRyxHQUFHLElBQUksd0JBQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3hDLFdBQVcsRUFBRSxpQkFBaUI7U0FDakMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztJQUN0RCxDQUFDO0NBQ0o7QUF2Q0Qsd0RBdUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGFtYmRhSW50ZWdyYXRpb24sIFJlc3RBcGkgfSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgeyBBdHRyaWJ1dGVUeXBlLCBUYWJsZSB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgeyBDb2RlLCBGdW5jdGlvbiwgUnVudGltZSwgVHJhY2luZyB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQXBwLCBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcblxuZXhwb3J0IGNsYXNzIEZpbmFuY2VEYXNoU2VydmVyU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IEFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgICAgIC8vIFRpY2tlciBEREIgdGFibGVcbiAgICAgICAgY29uc3QgdGlja2VyVGFibGUgPSBuZXcgVGFibGUodGhpcywgJ1RpY2tlclRhYmxlJywge1xuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7bmFtZTogJ2lkJywgdHlwZTogQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgICAgICAgc29ydEtleToge25hbWU6ICduYW1lJywgdHlwZTogQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAqICBUaGUgZGVmYXVsdCByZW1vdmFsIHBvbGljeSBpcyBSRVRBSU4sIHdoaWNoIG1lYW5zIHRoYXQgY2RrIGRlc3Ryb3kgd2lsbCBub3QgYXR0ZW1wdCB0byBkZWxldGVcbiAgICAgICAgICAgICogdGhlIG5ldyB0YWJsZSwgYW5kIGl0IHdpbGwgcmVtYWluIGluIHlvdXIgYWNjb3VudCB1bnRpbCBtYW51YWxseSBkZWxldGVkLiBCeSBzZXR0aW5nIHRoZSBwb2xpY3kgdG9cbiAgICAgICAgICAgICogREVTVFJPWSwgY2RrIGRlc3Ryb3kgd2lsbCBkZWxldGUgdGhlIHRhYmxlIChldmVuIGlmIGl0IGhhcyBkYXRhIGluIGl0KVxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSAvLyBOT1QgcmVjb21tZW5kZWQgZm9yIHByb2R1Y3Rpb24gY29kZVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBQdXQgdGlja2VyIGxhbWJkYSBmdW5jdGlvblxuICAgICAgICAvLyBUT0RPOiB3aGF0IGRvZXMgdHJhY2luZyBkb1xuICAgICAgICBjb25zdCBjcmVhdGVUaWNrZXJGdW5jdGlvbiA9IG5ldyBGdW5jdGlvbih0aGlzLCAnQ3JlYXRlVGlja2VyRnVuY3Rpb24nLCB7XG4gICAgICAgICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICAgaGFuZGxlcjogJ2FwcC5oYW5kbGVyJyxcbiAgICAgICAgICAgIGNvZGU6IENvZGUuZnJvbUFzc2V0KCdsYW1iZGFzL2NyZWF0ZS10aWNrZXInKSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgICAgICAnVElDS0VSX1RBQkxFJzogdGlja2VyVGFibGUudGFibGVOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRpY2tlclRhYmxlLmdyYW50V3JpdGVEYXRhKGNyZWF0ZVRpY2tlckZ1bmN0aW9uKTtcblxuICAgICAgICBjb25zdCBjcmVhdGVUaWNrZXJJbnRlZ3JhdGlvbiA9IG5ldyBMYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVUaWNrZXJGdW5jdGlvbik7XG5cbiAgICAgICAgY29uc3QgYXBpID0gbmV3IFJlc3RBcGkodGhpcywgJ1RpY2tlcnNBcGknLCB7XG4gICAgICAgICAgICByZXN0QXBpTmFtZTogJ1RpY2tlcnMgU2VydmljZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdGlja2VycyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdUaWNrZXJzJyk7XG4gICAgICAgIHRpY2tlcnMuYWRkTWV0aG9kKCdHRVQnLCBjcmVhdGVUaWNrZXJJbnRlZ3JhdGlvbik7XG4gICAgfVxufVxuIl19