import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path';

import type { Construct } from 'constructs';
import { getRemovalPolicyFromStage } from '../../../utils';

interface ServiceStatelessStackProps extends cdk.NestedStackProps {
  shared: {
    stage: string;
    serviceName: string;
    metricNamespace: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
    };
  };
  env: {
    account: string;
    region: string;
  };
  stateless: {
    runtimes: lambda.Runtime;
  };
  serviceTable: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ServiceStatelessSTack extends cdk.NestedStack {
  private serviceTable: dynamodb.Table;
  private userPool: cognito.UserPool;
  private userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: ServiceStatelessStackProps) {
    super(scope, id, props);

    const {
      shared: {
        stage,
        serviceName,
        metricNamespace,
        logging: { logLevel, logEvent },
      },
      env: {},
      stateless: { runtimes },
      serviceTable,
      userPool,
      userPoolClient,
    } = props;

    this.serviceTable = serviceTable;
    this.userPool = userPool;
    this.userPoolClient = userPoolClient;

    const lambdaConfig = {
      LOG_LEVEL: logLevel,
      POWERTOOLS_LOGGER_LOG_EVENT: logEvent,
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
      POWERTOOLS_SERVICE_NAME: serviceName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_METRICS_NAMESPACE: metricNamespace,
    };

    // we create the lambda function for creating car orders in the manufacturer domain
    const createOrderLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'CreateCarOrderLambda', {
        functionName: `create-car-order-lambda-${stage}`,
        runtime: runtimes,
        entry: path.join(
          __dirname,
          '../../src/adapters/primary/create-order/create-order.adapter.ts',
        ),
        memorySize: 1024,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        description: 'Create a car order',
        logRetention: logs.RetentionDays.ONE_DAY,
        environment: {
          ...lambdaConfig,
          SEVICE_TABLE_NAME: this.serviceTable.tableName,
          STAGE: stage,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/*'],
        },
      });
    createOrderLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // we allow the lambda function to write to the dynamodb table for storing car orders
    this.serviceTable.grantWriteData(createOrderLambda);

    // create the lambda custom authoriser for the api gateway resources to ensure that
    // we can only access the resources with a valid token
    const lambdaCustomAuthoriser = new nodeLambda.NodejsFunction(
      this,
      'ApiLambdaAuthoriser',
      {
        functionName: `resource-server-lambda-authoriser-${stage}`,
        logRetention: logs.RetentionDays.ONE_DAY,
        runtime: runtimes,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(
          __dirname,
          '../../src/adapters/primary/lambda-authorizer/lambda-authorizer.adapter.ts',
        ),
        memorySize: 128,
        handler: 'handler',
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          STAGE: stage,
          CLIENT_ID: this.userPoolClient.userPoolClientId,
          USER_POOL_ID: this.userPool.userPoolId,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/*'],
        },
      },
    );
    lambdaCustomAuthoriser.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // we create a request authoriser for the api gateway
    const authoriser = new apigateway.RequestAuthorizer(
      this,
      'LambdaAuthoriser',
      {
        handler: lambdaCustomAuthoriser,
        identitySources: [apigateway.IdentitySource.header('Authorization')],
        resultsCacheTtl: cdk.Duration.hours(1),
      },
    );

    // we create the car orders api gateway rest api
    const api = new apigateway.RestApi(this, 'CarOrdersApi', {
      restApiName: `Car Orders API ${stage}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    const root: apigateway.Resource = api.root.addResource('v1');
    const ordersResource = root.addResource('orders');
    ordersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createOrderLambda, {
        proxy: true,
      }),
      {
        authorizer: authoriser, // we add the authoriser to the method
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      },
    );

    new cdk.CfnOutput(this, 'CarOrdersApiUrl', { value: api.url });
  }
}
