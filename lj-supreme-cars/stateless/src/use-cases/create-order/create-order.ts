import { getISOString, logger, schemaValidator } from '@shared';

import { CreateOrder } from '@dto/create-order';
import { Order } from '@dto/order';
import { config } from '@config';
import { createItem } from '@adapters/secondary';
import { schema } from '@schemas/order';
import { v4 as uuid } from 'uuid';

const serviceTable = config.get('serviceTable');

export async function createOrderUseCase(order: CreateOrder): Promise<Order> {
  const createdDate = getISOString();
  const orderId = uuid();

  const newOrder: Order = {
    id: orderId,
    pk: `ORDER#${orderId}`,
    sk: `ORDER#${orderId}`,
    created: createdDate,
    updated: createdDate,
    status: 'pending',
    ...order,
  };

  schemaValidator(schema, newOrder);

  await createItem<Order>({
    tableName: serviceTable,
    newItem: newOrder,
    idToLog: newOrder.id,
  });

  logger.info(`order created`);

  return newOrder;
}
