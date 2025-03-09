export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Order',
  type: 'object',
  required: [
    'pk',
    'sk',
    'id',
    'created',
    'updated',
    'branchId',
    'carModelId',
    'quantity',
    'status',
  ],
  properties: {
    pk: {
      type: 'string',
      description: 'The pk of the order',
    },
    sk: {
      type: 'string',
      description: 'The sk of the order',
    },
    id: {
      type: 'string',
      description: 'The ID of the order',
    },
    created: {
      type: 'string',
      description: 'The created date of the order',
    },
    updated: {
      type: 'string',
      description: 'The updated date of the order',
    },
    branchId: {
      type: 'string',
      description: 'The ID of the branch placing the order',
    },
    carModelId: {
      type: 'string',
      description: 'The ID of the car model being ordered',
    },
    quantity: {
      type: 'number',
      minimum: 1,
      description: 'Number of cars being ordered',
    },
    color: {
      type: 'string',
      description: 'Optional color of the car',
    },
    trimLevel: {
      type: 'string',
      description: 'Optional trim or package level',
    },
    status: {
      type: 'string',
      description: 'The status of the order',
      enum: ['pending', 'completed', 'canceled'],
    },
    options: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'List of additional features',
    },
    notes: {
      type: 'string',
      description: 'Freeform notes about the order',
    },
  },
  additionalProperties: false,
};
