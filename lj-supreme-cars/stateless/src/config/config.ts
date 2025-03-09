const convict = require('convict');

export const config = convict({
  // shared config
  stage: {
    doc: 'The stage being deployed',
    format: String,
    default: '',
    env: 'STAGE',
  },
  region: {
    doc: 'The region being deployed to',
    format: String,
    default: '',
    env: 'REGION',
  },
  cognitoWafKey: {
    doc: 'The cognito WAF key value',
    env: 'COGNITO_WAF_KEY',
    format: String,
    default: '',
  },
  cognitoWafKeyName: {
    doc: 'The cognito WAF key name',
    env: 'COGNITO_WAF_KEY_NAME',
    format: String,
    default: '',
  },
  // stateful config
  tokenCacheTableName: {
    doc: 'The database table where we store tokens',
    format: String,
    default: '',
    env: 'TABLE_NAME',
  },
  serviceTable: {
    doc: 'The database table where we store items',
    format: String,
    default: '',
    env: 'SEVICE_TABLE_NAME',
  },
  // token endpoint
  tokenEndpoint: {
    doc: 'The token endpoint',
    format: String,
    default: '',
    env: 'TOKEN_ENDPOINT',
  },
  // authorizer config
  userPoolId: {
    doc: 'The cognito userpool Id',
    env: 'USER_POOL_ID',
    format: String,
    default: '',
  },
  clientId: {
    doc: 'The cognito client Id',
    env: 'CLIENT_ID',
    format: String,
    default: '',
  },
  authorizerDebugMode: {
    doc: 'Boolean to indicate if the authorizer has debug logs',
    env: 'AUTHORIZER_DEBUG_MODE',
    format: String,
    default: 'false',
  },
}).validate({ allowed: 'strict' });
