import {
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  SimpleChanges,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import { TransactionService } from '../transaction.service';
import { Transaction, TransactionTotalsState } from '../transaction.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Dialog } from '../../../shared/dialogs/dialog/dialog';
import { TransactionForm } from '../transaction-form/transaction-form';
import { Category, CategoryType } from '../../categories/category.model';
import { DeleteConfirmationDialog } from '../../../shared/dialogs/delete-confirmation-dialog/delete-confirmation-dialog';
import { IconButton } from '../../../shared/buttons/icon-button/icon-button';
import { SaveChangesDialog } from '../../../shared/dialogs/save-changes-dialog/save-changes-dialog';
import { ApiError } from '../../../core/api/api-error.model';
import { TextButton } from '../../../shared/buttons/text-button/text-button';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss',
  imports: [
    DatePipe,
    CurrencyPipe,
    Dialog,
    TransactionForm,
    IconButton,
    SaveChangesDialog,
    DeleteConfirmationDialog,
    TextButton,
  ],
})
export class TransactionList implements OnChanges {
  private readonly transactionService = inject(TransactionService);
  private readonly destroyRef = inject(DestroyRef);
  readonly transactionsChanged = output<void>();
  readonly transactionsLoaded = output<Transaction[]>();
  private loadRequest?: Subscription;
  protected readonly deleteDialog = viewChild.required<DeleteConfirmationDialog>('deleteDialog');
  protected readonly deleting = signal(false);
  protected readonly responseError = signal('');
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly selectedTransaction = signal<Transaction | null>(null);
  protected categoryType = CategoryType;
  categories = input<Category[]>([]);
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  readonly totalsChanged = output<TransactionTotalsState>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['year'] || changes['month']) {
      this.transactions.set([]);
      this.loadTransactions();
    }
  }

  protected onTransactionSaved(dialog: Dialog) {
    dialog.forceClose();
    this.transactionsChanged.emit();
    this.loadTransactions();
  }

  loadTransactions() {
    this.loadRequest?.unsubscribe();

    this.loading.set(true);
    this.loadError.set('');
    this.totalsChanged.emit({ status: 'loading' });
    this.loadRequest = this.transactionService
      .getAll(this.year(), this.month())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (transactions) => {
          this.transactions.set(transactions);
          let expenses = 0;
          let incomes = 0;
          transactions.forEach((item) => {
            if (item.category.type === this.categoryType.Expense) {
              expenses += Math.round(item.amount * 100);
            } else {
              incomes += Math.round(item.amount * 100);
            }
          });
          this.totalsChanged.emit({ status: 'ready', expenses: expenses / 100, income: incomes / 100 });
          this.transactionsLoaded.emit(transactions);
        },
        error: () => {
          this.loadError.set('Transactions could not be loaded. Please try again.');
          this.totalsChanged.emit({
            status: 'error',
            message: 'Totals could not be loaded. Please try again.',
          });
        },
      });
  }

  protected onEditClosed(form: TransactionForm): void {
    form.reset();
    this.selectedTransaction.set(null);
  }

  protected openEditDialog(transaction: Transaction, dialog: Dialog): void {
    this.selectedTransaction.set(transaction);
    dialog.open();
  }

  protected openDeleteDialog(transaction: Transaction, dialog: DeleteConfirmationDialog): void {
    this.responseError.set('');
    this.selectedTransaction.set(transaction);
    dialog.open();
  }

  protected confirmDelete(): void {
    const transaction = this.selectedTransaction();
    if (!transaction || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.responseError.set('');
    this.transactionService
      .delete(transaction.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.deleteDialog().close();
          this.transactionsChanged.emit();
          this.loadTransactions();
        },
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as ApiError | null;
          this.responseError.set(apiError?.message ?? 'Something went wrong.');
        },
      });
  }
}
