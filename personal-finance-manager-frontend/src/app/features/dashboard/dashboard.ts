import { Component, computed, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Transaction, TransactionTotalsState } from '../transactions/transaction.model';
import { CategoryList } from '../categories/category-list/category-list';
import { TransactionList } from '../transactions/transaction-list/transaction-list';
import { CategoryService } from '../categories/category.service';
import { Category } from '../categories/category.model';
import { BudgetList } from '../budgets/budget-list/budget-list';
import { SummaryList } from '../summary/summary';
import { SpendingByCategory } from '../spending-by-category/spending-by-category';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { TextButton } from '../../shared/buttons/text-button/text-button';
import { MIN_YEAR, MAX_YEAR } from '../../shared/validators/supported-date';

@Component({
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  imports: [
    CategoryList,
    TransactionList,
    BudgetList,
    DatePipe,
    SummaryList,
    SpendingByCategory,
    TextButton,
  ],
})
export class Dashboard implements OnInit {
  protected readonly transactionList = viewChild.required<TransactionList>('transactionList');
  protected readonly budgetList = viewChild.required<BudgetList>('budgetList');

  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private categoryRequest?: Subscription;
  protected readonly categoriesLoading = signal(false);
  protected readonly categoriesError = signal('');
  protected readonly selectedDate = signal(new Date());
  protected readonly canGoBack = computed(() =>
    this.selectedDate().getFullYear() > MIN_YEAR || this.selectedDate().getMonth() > 0);
  protected readonly canGoForward = computed(() =>
    this.selectedDate().getFullYear() < MAX_YEAR || this.selectedDate().getMonth() < 11);
  protected readonly categories = signal<Category[]>([]);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly totals = signal<TransactionTotalsState>({ status: 'loading' });

  protected changeMonth(offset: number): void {
    const current = this.selectedDate();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    if (next.getFullYear() < MIN_YEAR || next.getFullYear() > MAX_YEAR) return;

    this.totals.set({ status: 'loading' });
    this.transactions.set([]);
    this.selectedDate.set(next);
  }

  categoryChanged() {
    this.loadCategories();
    this.transactionList().loadTransactions();
    this.budgetList().loadBudgets();
  }

  transactionChanged() {
    this.budgetList().loadBudgets();
  }

  ngOnInit() {
    this.loadCategories();
  }

  protected onTotalsChanged(state: TransactionTotalsState): void {
    this.totals.set(state);
    if (state.status !== 'ready') {
      this.transactions.set([]);
    }
  }

  protected loadCategories(): void {
    this.categoryRequest?.unsubscribe();
    this.categoriesLoading.set(true);
    this.categoriesError.set('');
    this.categoryRequest = this.categoryService
      .getAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.categoriesLoading.set(false)),
      )
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categoriesError.set('Categories could not be loaded. Please try again.'),
      });
  }
}
