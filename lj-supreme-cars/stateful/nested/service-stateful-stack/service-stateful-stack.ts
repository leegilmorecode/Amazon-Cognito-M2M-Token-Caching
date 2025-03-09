import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import type { Construct } from 'constructs';
import { getRemovalPolicyFromStage } from '../../../utils';

interface ServiceStatefulStackProps extends cdk.NestedStackProps {
  shared: {
    stage: string;
  };
  stateful: {};
}

export class ServiceStatefulStack extends cdk.NestedStack {
  public readonly serviceTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ServiceStatefulStackProps) {
    super(scope, id, props);

    const {
      shared: { stage },
    } = props;

    // this is the table that will be used to store car orders in the manufacturer domain
    this.serviceTable = new dynamodb.Table(this, 'ServiceTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `car-orders-table-${stage}`,
      removalPolicy: getRemovalPolicyFromStage(stage),
    });
  }
}
