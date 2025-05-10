import {
  cacheToken,
  computeClientSecretHash,
  getCachedToken,
  requestCognitoToken,
} from '@adapters/secondary';

import { ReturnToken } from '@dto/token';
import { config } from '@config';
import { logger } from '@shared';

const tokenEndpoint = config.get('tokenEndpoint');
const cognitoWafKey = config.get('cognitoWafKey');
const cognitoWafKeyName = config.get('cognitoWafKeyName');

export async function getTokenUseCase(
  tokenCacheTableName: string,
  clientId: string,
  clientSecret: string,
  scopes?: string[],
): Promise<ReturnToken> {
  logger.debug(
    `Checking cache for existing token for client: ${clientId} & scopes ${scopes ? scopes?.join(' ') : 'none'}`,
  );

  // 1. Generate the client secret hash based on the client ID and secret
  const clientSecretHash = computeClientSecretHash(clientId, clientSecret);

  logger.debug(`Client secret hash: ${clientSecretHash}`); // for example only - dont log in prod!

  // 2. Get the token from the cache if it exists
  const cachedToken = await getCachedToken(
    tokenCacheTableName,
    clientSecretHash,
    scopes ?? [],
  );

  if (cachedToken) {
    // for example only - dont log in prod!
    logger.debug(
      `Token found in cache for client: ${clientId} & token: ${JSON.stringify(cachedToken)}`,
    );

    const currentTime = Math.floor(Date.now() / 1000);
    const remaining = cachedToken.expires_at - currentTime;

    return {
      access_token: cachedToken.access_token,
      token_type: cachedToken.token_type,
      expires_in: remaining,
    };
  }

  logger.info(
    `No cached token found for client: ${clientId}. Requesting new token from Cognito.`,
  );

  // 3. If not found, call Cognito to get the token
  const newToken = await requestCognitoToken(
    tokenEndpoint,
    clientId,
    clientSecret,
    scopes || [],
    cognitoWafKeyName,
    cognitoWafKey,
  );

  logger.debug(`New Token: ${JSON.stringify(newToken)}`);

  // 4. Cache the new token if it has been generated
  await cacheToken(
    tokenCacheTableName,
    newToken,
    clientSecretHash,
    scopes ?? [],
  );

  logger.info(`New token cached successfully for client: ${clientId}`);

  return {
    access_token: newToken.access_token,
    token_type: newToken.token_type,
    expires_in: newToken.expires_in,
  };
}
