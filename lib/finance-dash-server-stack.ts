import * as ddb from '@aws-cdk/aws-sns';

import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';

import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';

export class CdkTestStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'CdkTestQueue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'CdkTestTopic');

    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}




import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { EventBus, Rule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { Policy, PolicyStatement } from '@aws-cdk/aws-iam';
import { Code, Function, Runtime, Tracing } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { CfnOutput } from '@aws-cdk/core';

export class CdkDayStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ###################################################
    // Ticker DDB table
    // ###################################################
    const tickerTable = new Table(this, "TickerTable", {
      partitionKey: {name: 'id', type: AttributeType.STRING},
      sortKey: {name: 'name', type: AttributeType.STRING}
    })

    // ###################################################
    // Put ticker function
    // ###################################################
    const putTickerFunction = new Function(this, "PutTickerFunction", {
        runtime: Runtime.NODEJS_14_X,
        handler: 'app.handler',
        code: Code.fromAsset('src/put-ticker'),
        tracing: Tracing.ACTIVE
    })

    tickerTable.grantPutEventsTo(putTickerFunction)

    // ###################################################
    // Put translation function
    // ###################################################
    const putTranslationFunction = new Function(this, "PutTranslationFunction", {
      runtime: Runtime.NODEJS_14_X,
      handler: 'app.handler',
      code: Code.fromAsset('src/put-translation'),
      tracing: Tracing.ACTIVE,
      environment: {
        'TRANSLATE_BUS': translateBus.eventBusName
      }
    })

    translateBus.grantPutEventsTo(putTranslationFunction)

    const translatePolicyStatement = new PolicyStatement({
      actions: ['translate:TranslateText'],
      resources: ['*']
    })

    putTranslationFunction.role?.attachInlinePolicy(
      new Policy(this, "PutTranslatePolicy", {
        statements: [translatePolicyStatement]
      })
    )

    // ###################################################
    // Get translations function
    // ###################################################
    const getTranslationFunction = new Function(this, "GetTranslationFunction", {
      runtime: Runtime.NODEJS_14_X,
      handler: 'app.handler',
      code: Code.fromAsset('src/get-translation'),
      tracing: Tracing.ACTIVE,
      environment: {
        'TRANSLATE_TABLE': translateTable.tableName
      }
    })

    translateTable.grantReadData(getTranslationFunction)

    // ###################################################
    // Save translations function
    // ###################################################
    const saveTranslationFunction = new Function(this, "SaveTranslationFunction", {
      runtime: Runtime.NODEJS_14_X,
      handler: 'app.handler',
      code: Code.fromAsset('src/save-translation'),
      tracing: Tracing.ACTIVE,
      environment:{
        'TRANSLATE_TABLE': translateTable.tableName
      }
    })

    translateTable.grantWriteData(saveTranslationFunction)

    // ###################################################
    // EventBridge Rule
    // ###################################################
    new Rule(this, "SaveTranslationRule", {
      eventBus: translateBus,
      eventPattern: {detailType: ["translation"]},
      targets:[new LambdaFunction(saveTranslationFunction)]
    })

    // ###################################################
    // API Gateway and routes
    // ###################################################
    const translateAPI = new HttpApi(this, "TranslateAPI")

    translateAPI.addRoutes({
      path: '/',
      methods: [HttpMethod.POST],
      integration: new LambdaProxyIntegration({
        handler: putTranslationFunction
      })
    })

    const getProxy = new LambdaProxyIntegration({
      handler: getTranslationFunction
    })

    translateAPI.addRoutes({
      path: '/{id}',
      methods: [HttpMethod.GET],
      integration: getProxy
    })

    translateAPI.addRoutes({
      path: '/',
      methods: [HttpMethod.GET],
      integration: getProxy
    })

    // ###################################################
    // Outputs
    // ###################################################
    new CfnOutput(this, 'API url', {
      value: translateAPI.url!
    })
    new CfnOutput(this, 'Put Function Name', {
      value: putTranslationFunction.functionName
    })
    new CfnOutput(this, 'Save Function Name', {
      value: saveTranslationFunction.functionName
    })
    new CfnOutput(this, 'Get Function Name', {
      value: getTranslationFunction.functionName
    })
    new CfnOutput(this, "Translation Bus", {
      value: translateBus.eventBusName
    })
    new CfnOutput(this, "Translation Table", {
      value: translateTable.tableName
    })
  }
}