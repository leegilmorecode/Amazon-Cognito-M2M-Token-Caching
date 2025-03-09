import { Token } from '@dto/token';
import axios from 'axios';
import crypto from 'crypto';

export function computeClientSecretHash(
  clientId: string,
  clientSecret: string,
): string {
  return crypto
    .createHmac('sha256', clientSecret)
    .update(clientId)
    .digest('base64');
}

export async function requestCognitoToken(
  tokenEndpoint: string,
  clientId: string,
  clientSecret: string,
  scopes: string[] = [],
  cognitoWafKeyName: string,
  cognitoWafKey: string,
): Promise<Token> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64',
  );

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
  });

  if (scopes.length > 0) {
    params.append('scope', scopes.join(' '));
  }

  const response = await axios.post<Token>(tokenEndpoint, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      [cognitoWafKeyName]: cognitoWafKey, // we add the WAF key to the header for the cognito domain
    },
  });

  return response.data;
}
