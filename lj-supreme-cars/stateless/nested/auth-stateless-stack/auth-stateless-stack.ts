import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

import type { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AuthStatelessStackProps extends cdk.NestedStackProps {
  shared: {
    stage: string;
    tokenEndpoint: string;
    serviceName: string;
    metricNamespace: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
    };
    waf: {
      headerName: string;
      headerValue: string;
    };
  };
  env: {
    account: string;
    region: string;
  };
  stateless: {};
  tokenTable: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class AuthStatelessStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: AuthStatelessStackProps) {
    super(scope, id, props);

    const {
      shared: {
        tokenEndpoint,
        stage,
        serviceName,
        metricNamespace,
        logging: { logLevel, logEvent },
        waf: { headerName, headerValue },
      },
      env: { region },
      tokenTable,
      userPool,
      userPoolClient,
    } = props;

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

    // The lambda function that will handle the token request and caching
    const tokenLambda = new NodejsFunction(this, 'TokenHandlerLambda', {
      functionName: `token-handler-lambda-${stage}`,
      memorySize: 1024,
      description: `get token handler ${stage}`,
      logRetention: logs.RetentionDays.ONE_DAY,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      tracing: lambda.Tracing.ACTIVE,
      entry: path.join(
        __dirname,
        '../../src/adapters/primary/get-token/get-token.adapter.ts',
      ),
      bundling: {
        minify: true,
        externalModules: ['@aws-sdk/*'],
      },
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        TABLE_NAME: tokenTable.tableName,
        REGION: region,
        TOKEN_ENDPOINT: tokenEndpoint,
        ...lambdaConfig,
        COGNITO_WAF_KEY_NAME: headerName,
        COGNITO_WAF_KEY: headerValue,
      },
    });

    // enable the lambda function to read/write from/to the DynamoDB table and interact with cognito
    tokenTable.grantReadWriteData(tokenLambda);
    tokenLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:InitiateAuth'],
        resources: [userPool.userPoolArn],
      }),
    );

    // we create the api gateway rest api for the token endpoint for m2m clients to use
    const api = new apigateway.RestApi(this, 'M2MAuthApi', {
      restApiName: `M2M Auth API ${stage}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    const oauthResource = api.root.addResource('oauth2');
    const tokenResource = oauthResource.addResource('token');
    tokenResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(tokenLambda),
    );

    // Create WAF WebACL for Cognito User Pool so it can only be used with the correct
    // header value. This is to prevent the Cognito User Pool domain API being called directly
    const webAcl = new wafv2.CfnWebACL(this, 'CognitoWebACL', {
      name: `${serviceName}-cognito-${stage}-waf`,
      scope: 'REGIONAL',
      defaultAction: { block: {} },
      rules: [
        {
          name: 'AllowSpecificHeader',
          priority: 0,
          action: { allow: {} },
          statement: {
            byteMatchStatement: {
              fieldToMatch: {
                singleHeader: {
                  name: headerName, // this comes from our app config
                },
              },
              positionalConstraint: 'EXACTLY',
              searchString: headerValue, // this comes from our app config
              textTransformations: [
                {
                  priority: 0,
                  type: 'NONE',
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${serviceName}-cognito-header-rule-${stage}`,
            sampledRequestsEnabled: true,
          },
        },
      ],
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${serviceName}-cognito-waf-${stage}`,
        sampledRequestsEnabled: true,
      },
    });

    // Construct the ARN for the Cognito User Pool domain
    // arn: *partition* :cognito-idp: *region* : *account-id* :userpool/ *user-pool-id*
    const cognitoDomainArn = `arn:aws:cognito-idp:${region}:${props.env.account}:userpool/${userPool.userPoolId}`;

    // Associate WAF with Cognito User Pool domain
    new wafv2.CfnWebACLAssociation(this, 'CognitoWebACLAssociation', {
      resourceArn: cognitoDomainArn,
      webAclArn: webAcl.attrArn,
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
