export type Order = {
  id: string;
  pk: string;
  sk: string;
  created: string;
  updated: string;
  branchId: string;
  carModelId: string;
  quantity: number;
  color?: string;
  trimLevel?: string;
  options?: string[];
  notes?: string;
  status: string;
};
