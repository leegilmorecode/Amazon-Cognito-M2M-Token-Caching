import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { AuthStatefulStack } from './nested/auth-stateful-stack/auth-stateful-stack';
import { Construct } from 'constructs';
import { ServiceStatefulStack } from './nested/service-stateful-stack/service-stateful-stack';

interface LjSupremeCarsStatefulStackProps extends cdk.NestedStackProps {
  env: {
    account: string;
    region: string;
  };
  shared: {
    stage: string;
  };
  stateful: {};
}

// we are creating two stacks, one for the auth service and one for the resource service
export class LjSupremeCarsStatefulStack extends cdk.Stack {
  public readonly authStatefulStack: AuthStatefulStack;
  public readonly serviceStatefulStack: ServiceStatefulStack;
  public readonly tokenCacheTable: dynamodb.Table;
  public readonly serviceTable: dynamodb.Table;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(
    scope: Construct,
    id: string,
    props: LjSupremeCarsStatefulStackProps,
  ) {
    super(scope, id, props);

    const {
      shared: { stage },
    } = props;

    this.authStatefulStack = new AuthStatefulStack(
      this,
      `AuthStatefulStack-${stage}`,
      {
        shared: props.shared,
        stateful: props.stateful,
        env: props.env,
      },
    );

    this.tokenCacheTable = this.authStatefulStack.tokenCacheTable;
    this.userPool = this.authStatefulStack.userPool;
    this.userPoolClient = this.authStatefulStack.userPoolClient;

    this.serviceStatefulStack = new ServiceStatefulStack(
      this,
      `ServiceStatefulStack-${stage}`,
      {
        shared: props.shared,
        stateful: props.stateful,
      },
    );

    this.serviceTable = this.serviceStatefulStack.serviceTable;
  }
}
