import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { errorHandler, getHeaders, logger } from '@shared';

import { ReturnToken } from '@dto/token';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { ValidationError } from '@errors/validation-error';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { config } from '@config';
import { getTokenUseCase } from '@use-cases/get-token';
import httpErrorHandler from '@middy/http-error-handler';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const tracer = new Tracer();
const metrics = new Metrics();

const stage = config.get('stage');
const tokenCacheTableName = config.get('tokenCacheTableName');

export const getTokenAdapter = async ({
  body,
  headers,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) throw new ValidationError('No body provided');

    if (
      headers['content-type'] &&
      headers['content-type'] !== 'application/x-www-form-urlencoded'
    ) {
      throw new ValidationError('Invalid content type');
    }

    if (
      headers['Content-Type'] &&
      headers['Content-Type'] !== 'application/x-www-form-urlencoded'
    ) {
      throw new ValidationError('Invalid content type');
    }

    if (!headers['Authorization']) {
      throw new ValidationError('No authorization header provided');
    }

    const authHeader = headers['Authorization'];
    if (!authHeader.startsWith('Basic ')) {
      throw new ValidationError('Invalid authorization header format');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString();
    const [clientId, clientSecret] = credentials.split(':');

    if (!clientId || !clientSecret) {
      throw new ValidationError('Invalid client credentials');
    }

    const params = new URLSearchParams(body);
    const grantType = params.get('grant_type');

    if (grantType !== 'client_credentials') {
      throw new ValidationError('Invalid grant type');
    }

    const scopesParam = params.get('scope');
    const scopes = scopesParam ? scopesParam.split(' ') : undefined;

    logger.debug(`scopes requested: ${scopes ?? 'none'}`);

    const token: ReturnToken = await getTokenUseCase(
      tokenCacheTableName,
      clientId,
      clientSecret,
      scopes,
    );

    metrics.addMetric('SuccessfulGetToken', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify(token),
      headers: getHeaders(stage),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('GetTokenError', MetricUnit.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(getTokenAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
