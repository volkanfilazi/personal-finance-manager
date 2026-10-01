import { Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Transaction, TransactionTotalsState } from '../transactions/transaction.model';
import { CategoryType } from '../categories/category.model';
import { TextButton } from '../../shared/buttons/text-button/text-button';

@Component({
  selector: 'app-spending-by-category',
  templateUrl: './spending-by-category.html',
  styleUrl: './spending-by-category.scss',
  imports: [CurrencyPipe, TextButton],
})
export class SpendingByCategory {
  readonly transactions = input<Transaction[]>([]);
  readonly status = input<TransactionTotalsState['status']>('loading');
  readonly retry = output<void>();

  protected readonly spending = computed(() => {
    const categories = new Map<string, { id: string; name: string; amount: number }>();
    for (const transaction of this.transactions()) {
      if (transaction.category.type !== CategoryType.Expense) continue;
      const category = categories.get(transaction.category.id) ?? {
        id: transaction.category.id,
        name: transaction.category.name,
        amount: 0,
      };
      // Sum in cents to avoid floating-point artifacts in money comparisons.
      category.amount += Math.round(transaction.amount * 100);
      categories.set(category.id, category);
    }
    return [...categories.values()]
      .filter((category) => category.amount > 0)
      .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
      .map((category) => ({ ...category, amount: category.amount / 100 }));
  });

  protected readonly highest = computed(() => {
    const spending = this.spending();
    return spending.filter((category) => category.amount === spending[0]?.amount);
  });
}
