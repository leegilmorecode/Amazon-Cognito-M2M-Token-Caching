import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Region, Stage } from '../types';

export interface EnvironmentConfig {
  shared: {
    stage: Stage;
    serviceName: string;
    tokenEndpoint: string;
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
  stateless: {
    runtimes: lambda.Runtime;
  };
  stateful: {};
}

export const getEnvironmentConfig = (stage: Stage): EnvironmentConfig => {
  switch (stage) {
    case Stage.test:
      return {
        shared: {
          tokenEndpoint: `https://car-manufacturer-auth-${Stage.test}.auth.${Region.dublin}.amazoncognito.com/oauth2/token`,
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-supreme-service-${Stage.test}`,
          metricNamespace: `lj-supreme-${Stage.test}`,
          stage: Stage.test,
          waf: {
            headerName: 'x-cognito-waf-key',
            headerValue: '0dfdc09a-7001-49d6-882b-7fcc7b8d29d4',
          },
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {},
      };
    case Stage.staging:
      return {
        shared: {
          tokenEndpoint: `https://car-manufacturer-auth-${Stage.staging}.auth.${Region.london}.amazoncognito.com/oauth2/token`,
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-supreme-service-${Stage.staging}`,
          metricNamespace: `lj-supreme-${Stage.staging}`,
          stage: Stage.staging,
          waf: {
            headerName: 'x-cognito-waf-key',
            headerValue: '0dfdc09a-7001-49d6-882b-7fcc7b8d29d4',
          },
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {},
      };
    case Stage.prod:
      return {
        shared: {
          tokenEndpoint: `https://car-manufacturer-auth-${Stage.prod}.auth.${Region.dublin}.amazoncognito.com/oauth2/token`,
          logging: {
            logLevel: 'INFO',
            logEvent: 'true',
          },
          serviceName: `lj-supreme-service-${Stage.prod}`,
          metricNamespace: `lj-supreme-${Stage.prod}`,
          stage: Stage.prod,
          waf: {
            headerName: 'x-cognito-waf-key',
            headerValue: 'db3eb761-49e1-4a8e-a3ec-a9c6e9d3e965',
          },
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {},
      };
    case Stage.develop:
      return {
        shared: {
          tokenEndpoint: `https://car-manufacturer-auth-${Stage.develop}.auth.${Region.london}.amazoncognito.com/oauth2/token`,
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-supreme-service-${Stage.develop}`,
          metricNamespace: `lj-supreme-${Stage.develop}`,
          stage: Stage.develop,
          waf: {
            headerName: 'x-cognito-waf-key',
            headerValue: '0dfdc09a-7001-49d6-882b-7fcc7b8d29d4',
          },
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {},
      };
    default:
      return {
        shared: {
          tokenEndpoint: `https://car-manufacturer-auth-${stage}.auth.${Region.london}.amazoncognito.com/oauth2/token`,
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-supreme-service-${stage}`,
          metricNamespace: `lj-supreme-${stage}`,
          stage: stage,
          waf: {
            headerName: 'x-cognito-waf-key',
            headerValue: '0dfdc09a-7001-49d6-882b-7fcc7b8d29d4',
          },
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {},
      };
  }
};
