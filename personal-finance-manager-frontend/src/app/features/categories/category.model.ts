export type CategoryType = 'Income' | 'Expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export interface CreateCategory {
  name: string;
  type: CategoryType;
}
