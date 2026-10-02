import {
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  SimpleChanges,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../../core/api/api-error.model';
import { BudgetService } from '../budget.service';
import { Category } from '../../categories/category.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { Budget } from '../budget.model';
import { Dialog } from '../../../shared/dialogs/dialog/dialog';
import { BudgetForm } from '../budget-form/budget-form';
import { DeleteConfirmationDialog } from '../../../shared/dialogs/delete-confirmation-dialog/delete-confirmation-dialog';
import { SaveChangesDialog } from '../../../shared/dialogs/save-changes-dialog/save-changes-dialog';
import { IconButton } from '../../../shared/buttons/icon-button/icon-button';
import { TextButton } from '../../../shared/buttons/text-button/text-button';
import { CurrencyPipe } from '@angular/common';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-budget-list',
  templateUrl: './budget-list.html',
  styleUrl: './budget-list.scss',
  imports: [
    Dialog,
    BudgetForm,
    DeleteConfirmationDialog,
    SaveChangesDialog,
    IconButton,
    TextButton,
    CurrencyPipe,
    DecimalPipe,
  ],
})
export class BudgetList implements OnChanges {
  private readonly budgetService = inject(BudgetService);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;
  protected readonly deleteDialog = viewChild.required<DeleteConfirmationDialog>('deleteDialog');
  protected readonly deleting = signal(false);
  protected readonly selectedBudget = signal<Budget | null>(null);
  protected readonly responseError = signal('');
  protected readonly loading = signal(false);
  protected readonly budgets = signal<Budget[]>([]);
  protected readonly loadError = signal('');
  categories = input<Category[]>([]);
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['year'] || changes['month']) this.loadBudgets();
  }

  protected onBudgetSaved(dialog: Dialog): void {
    dialog.forceClose();
    this.loadBudgets();
  }

  protected openDeleteDialog(budget: Budget, dialog: DeleteConfirmationDialog): void {
    this.responseError.set('');
    this.selectedBudget.set(budget);
    dialog.open();
  }

  protected onEditClosed(form: BudgetForm): void {
    form.reset();
    this.selectedBudget.set(null);
  }

  protected confirmDelete(): void {
    const budget = this.selectedBudget();
    if (!budget || this.deleting()) return;
    this.deleting.set(true);
    this.responseError.set('');
    this.budgetService
      .delete(budget.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.deleteDialog().close();
          this.loadBudgets();
        },
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as ApiError | null;
          this.responseError.set(
            apiError?.message ?? 'Budget could not be deleted. Please try again.',
          );
        },
      });
  }

  protected openEditDialog(budget: Budget, dialog: Dialog): void {
    this.selectedBudget.set(budget);
    dialog.open();
  }

  loadBudgets() {
    this.loadRequest?.unsubscribe();
    this.budgets.set([]);
    this.loading.set(true);
    this.loadError.set('');
    this.loadRequest = this.budgetService
      .getAll(this.year(), this.month())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (budgets) => this.budgets.set(budgets),
        error: () => this.loadError.set('Budgets could not be loaded. Please try again.'),
      });
  }
}
