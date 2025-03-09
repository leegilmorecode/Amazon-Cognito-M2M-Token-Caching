#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { LjSupremeCarsStatefulStack } from '../stateful/stateful';
import { LjSupremeCarsStatelessStack } from '../stateless/stateless';
import { Stage } from '../types';
import { getEnvironmentConfig } from '../app-config';
import { getStage } from '../utils';

const stage = getStage(process.env.STAGE as Stage) as Stage;
const appConfig = getEnvironmentConfig(stage);

const app = new cdk.App();

// we are creating two stacks, one for stateful resources and one for stateless resources
// these both have their own nested stacks
const statefulStack = new LjSupremeCarsStatefulStack(
  app,
  `LjSupremeCarsStatefulStack-${stage}`,
  {
    env: appConfig.env,
    shared: appConfig.shared,
    stateful: appConfig.stateless,
  },
);

new LjSupremeCarsStatelessStack(app, `LjSupremeCarsStatelessStack-${stage}`, {
  env: appConfig.env,
  shared: appConfig.shared,
  stateless: appConfig.stateless,
  tokenCacheTable: statefulStack.tokenCacheTable,
  userPool: statefulStack.userPool,
  userPoolClient: statefulStack.userPoolClient,
  serviceTable: statefulStack.serviceTable,
});
