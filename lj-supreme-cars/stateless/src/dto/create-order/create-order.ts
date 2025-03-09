export type CreateOrder = {
  branchId: string;
  carModelId: string;
  quantity: number;
  color?: string;
  trimLevel?: string;
  options?: string[];
  notes?: string;
};
