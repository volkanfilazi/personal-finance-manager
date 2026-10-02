export const CategoryType = {
  Income: 'Income',
  Expense: 'Expense',
} as const;

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isDeleted?: boolean;
}

export interface CreateCategory {
  name: string;
  type: CategoryType;
}
