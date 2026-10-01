import { Category } from '../categories/category.model';

export type TransactionTotalsState =
  | { status: 'loading' }
  | { status: 'ready'; income: number; expenses: number }
  | { status: 'error'; message: string };

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
