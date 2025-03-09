import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import type { Construct } from 'constructs';
import { getRemovalPolicyFromStage } from '../../../utils';

interface AuthStatefulStackProps extends cdk.NestedStackProps {
  shared: {
    stage: string;
  };
  env: {
    region: string;
  };
  stateful: {};
}

export class AuthStatefulStack extends cdk.NestedStack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly tokenCacheTable: dynamodb.Table;
  public readonly authUserPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: AuthStatefulStackProps) {
    super(scope, id, props);

    const {
      shared: { stage },
      env: { region },
    } = props;

    // create a user pool to manage m2m clients
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      removalPolicy: getRemovalPolicyFromStage(stage),
      userPoolName: `m2m-user-pool-${stage}`,
    });

    // create the user pool domain for the m2m clients
    // Note: as we are creating a proxy clients wont actually hit this direct
    this.authUserPoolDomain = new cognito.UserPoolDomain(
      this,
      'AuthUserPoolDomain',
      {
        userPool: this.userPool,
        cognitoDomain: {
          domainPrefix: `car-manufacturer-auth-${stage}`,
        },
      },
    );

    // we create our scope for creating a car order
    const createOrderScope: cognito.ResourceServerScope =
      new cognito.ResourceServerScope({
        scopeName: 'create.order',
        scopeDescription: 'create car order scope',
      });

    // we create our resource server (for placing car orders via the manufacturer domain service)
    const domainResourceServer: cognito.UserPoolResourceServer =
      this.userPool.addResourceServer('ManufacturingDomainResourceServer', {
        userPoolResourceServerName: `ManufacturingDomainResourceServer${stage}`,
        identifier: 'cars-service',
        scopes: [createOrderScope],
      });
    domainResourceServer.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // create a user pool client for the m2m client (the Newcastle car branch that will place the order in our example)
    // Note: we would create one of these for each client (branch) that will be using the m2m auth
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `user-pool-client-${stage}`,
      preventUserExistenceErrors: true,
      userPool: this.userPool,
      generateSecret: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      accessTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.minutes(60),
      oAuth: {
        flows: {
          clientCredentials: true,
        },
        scopes: [
          // it has the scopes assigned for hitting the manufacturer domain to create a car order
          cognito.OAuthScope.resourceServer(
            domainResourceServer,
            createOrderScope,
          ),
        ],
      },
    });
    this.userPoolClient.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // we create the table to store the tokens (cache)
    this.tokenCacheTable = new dynamodb.Table(this, 'TokenCacheTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expires_at', // we set this to expire the tokens after 60 minutes
      tableName: `token-cache-table-${stage}`,
      removalPolicy: getRemovalPolicyFromStage(stage),
    });

    new cdk.CfnOutput(this, 'CognitoDomainAuthUrl', {
      value: `https://${this.authUserPoolDomain.domainName}.auth.${region}.amazoncognito.com`,
      description: 'The cognito domain auth url',
      exportName: 'CognitoDomainAuthUrl',
    });
  }
}
