import { Category } from '../categories/category.model';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: Category;
}

export interface CreateTransaction {
  description: string;
  amount: number;
  date: string;
  categoryId: string;
}

export interface UpdateTransaction {
  description: string;
  amount: number;
  date: string;
  categoryId: string;
}
