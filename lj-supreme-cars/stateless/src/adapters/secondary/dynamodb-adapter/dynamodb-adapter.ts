import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { Token } from '@dto/token';
import { logger } from '@shared';

const dynamoDb = new DynamoDBClient();

export async function getCachedToken(
  tableName: string,
  clientSecretHash: string,
  scopes: string[] = [],
): Promise<Token | null> {
  const scopeKey = scopes.length > 0 ? scopes.join(' ') : 'NO_SCOPES';

  const params = {
    TableName: tableName,
    Key: marshall({ pk: `CLIENT#${clientSecretHash}`, sk: scopeKey }),
  };

  const { Item } = await dynamoDb.send(new GetItemCommand(params));

  if (!Item) return null;

  const token: Token = unmarshall(Item) as Token;

  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime < token.expires_at) {
    return token;
  }

  return null;
}

export async function cacheToken(
  tableName: string,
  token: Token,
  clientSecretHash: string,
  scopes: string[] = [],
): Promise<void> {
  const scopeKey = scopes.length > 0 ? scopes.join(' ') : 'NO_SCOPES';

  const params = {
    TableName: tableName,
    Item: marshall({
      pk: `CLIENT#${clientSecretHash}`,
      sk: scopeKey,
      ...token,
      expires_at: Math.floor(Date.now() / 1000) + token.expires_in - 60,
      // we ensure that the token is valid for 60 seconds less than the expires_in time
    }),
  };

  await dynamoDb.send(new PutItemCommand(params));
}

export async function createItem<T>({
  tableName,
  newItem,
  idToLog,
}: {
  tableName: string;
  newItem: T;
  idToLog: string;
}): Promise<T> {
  const params = {
    TableName: tableName,
    Item: marshall(newItem, {
      removeUndefinedValues: true,
    }),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.debug(`item created with ID ${idToLog} into ${tableName}`);

    return newItem;
  } catch (error) {
    logger.error(`error creating item: ${error}`);
    throw error;
  }
}
