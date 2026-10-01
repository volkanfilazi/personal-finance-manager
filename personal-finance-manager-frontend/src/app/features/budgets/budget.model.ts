import { Category } from '../categories/category.model';

export interface Budget {
  id: string;
  amount: number;
  year: number;
  month: number;
  category: Category;
  spent: number;
}

export interface CreateBudget {
  categoryId: string;
  amount: number;
  year: number;
  month: number;
}

export interface UpdateBudget {
  amount: number;
}
