export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'CreateOrder',
  type: 'object',
  required: ['branchId', 'carModelId', 'quantity'],
  properties: {
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
