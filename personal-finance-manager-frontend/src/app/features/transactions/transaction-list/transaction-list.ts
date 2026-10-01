import { Component, DestroyRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import { TransactionService } from '../transaction.service';
import { Transaction } from '../transaction.model';
import { DatePipe } from '@angular/common';
import { Dialog } from '../../../shared/dialogs/dialog/dialog';
import { TransactionForm } from '../transaction-form/transaction-form';
import { Category } from '../../categories/category.model';
import { DeleteConfirmationDialog } from '../../../shared/dialogs/delete-confirmation-dialog/delete-confirmation-dialog';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { SaveChangesDialog } from '../../../shared/dialogs/save-changes-dialog/save-changes-dialog';
import { ApiError } from '../../../core/api/api-error.model';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.html',
  imports: [
    DatePipe,
    Dialog,
    TransactionForm,
    IconButton,
    SaveChangesDialog,
    DeleteConfirmationDialog,
  ],
})
export class TransactionList implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;
  protected readonly deleteDialog = viewChild.required<DeleteConfirmationDialog>('deleteDialog');
  protected readonly deleting = signal(false);
  protected readonly responseError = signal('');
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly selectedTransaction = signal<Transaction | null>(null);
  categories = input<Category[]>([]);
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  ngOnInit() {
    this.loadTransactions();
  }

  protected onTransactionSaved(dialog: Dialog): void {
    dialog.forceClose();
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loadRequest?.unsubscribe();

    this.loading.set(true);
    this.loadError.set('');
    this.loadRequest = this.transactionService
      .getAll(this.year(), this.month())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (transactions) => this.transactions.set(transactions),
        error: () => this.loadError.set('Transactions could not be loaded. Please try again.'),
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
    if (!transaction || this.deleting()) return;

    this.deleting.set(true);
    this.responseError.set('');
    this.transactionService
      .delete(transaction.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.deleteDialog().close();
          this.loadTransactions();
        },
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as ApiError | null;
          this.responseError.set(apiError?.message ?? 'Something went wrong.');
        },
      });
  }
}
