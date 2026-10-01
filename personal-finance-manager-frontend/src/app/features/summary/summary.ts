import { Component, computed, input, output } from '@angular/core';
import { TransactionTotalsState } from '../transactions/transaction.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-summary-list',
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
  imports: [CurrencyPipe],
})
export class SummaryList {
  readonly totals = input<TransactionTotalsState>({ status: 'loading' });
  readonly transactionListRefresh = output<void>();
  protected readonly balance = computed(() => {
    const totals = this.totals();
    return totals.status === 'ready' ? totals.income - totals.expenses : null;
  });

  refreshTransactionList() {
    this.transactionListRefresh.emit();
  }
}
