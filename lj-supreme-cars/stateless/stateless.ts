import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type * as lambda from 'aws-cdk-lib/aws-lambda';

import { AuthStatelessStack } from './nested/auth-stateless-stack/auth-stateless-stack';
import { Construct } from 'constructs';
import { ServiceStatelessSTack as ServiceStatelessStack } from './nested/service-stateless-stack/service-stateless-stack';

interface LjSupremeCarsStatelessStackProps extends cdk.NestedStackProps {
  env: {
    account: string;
    region: string;
  };
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
  stateless: {
    runtimes: lambda.Runtime;
  };
  tokenCacheTable: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  serviceTable: dynamodb.Table;
}

// we are creating two stacks, one for the auth service and one for the client service
export class LjSupremeCarsStatelessStack extends cdk.Stack {
  public readonly authStatelessStack: AuthStatelessStack;
  public readonly serviceStatelessStack: ServiceStatelessStack;

  constructor(
    scope: Construct,
    id: string,
    props: LjSupremeCarsStatelessStackProps,
  ) {
    super(scope, id, props);

    const {
      tokenCacheTable: tokenTable,
      userPool,
      userPoolClient,
      serviceTable,
      shared: { stage },
    } = props;

    this.authStatelessStack = new AuthStatelessStack(
      this,
      `AuthStatelessStack-${stage}`,
      {
        shared: props.shared,
        env: props.env,
        stateless: props.stateless,
        tokenTable,
        userPool,
        userPoolClient,
      },
    );

    this.serviceStatelessStack = new ServiceStatelessStack(
      this,
      `ServiceStatelessStack-${stage}`,
      {
        shared: props.shared,
        stateless: props.stateless,
        env: props.env,
        serviceTable: serviceTable,
        userPool,
        userPoolClient,
      },
    );
  }
}
