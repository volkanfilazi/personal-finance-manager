import { Component, inject, input, OnInit, output, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CategoryService } from '../category.service';
import { Category } from '../category.model';
import { CategoryForm } from '../category-form/category-form';
import { Dialog } from '../../../shared/dialogs/dialog/dialog';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { ApiError } from '../../../core/api/api-error.model';
import { SaveChangesDialog } from '../../../shared/dialogs/save-changes-dialog/save-changes-dialog';
import { DeleteConfirmationDialog } from '../../../shared/dialogs/delete-confirmation-dialog/delete-confirmation-dialog';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
  imports: [CategoryForm, Dialog, IconButton, SaveChangesDialog, DeleteConfirmationDialog],
})
export class CategoryList {
  private readonly categoryService = inject(CategoryService);

  protected readonly deleteDialog = viewChild.required<DeleteConfirmationDialog>('deleteDialog');

  readonly categories = input<Category[]>([]);
  readonly categoriesChanged = output<void>();
  protected readonly selectedCategory = signal<Category | null>(null);
  protected readonly deleting = signal(false);
  protected readonly responseError = signal('');

  protected onCategorySaved(dialog: Dialog): void {
    dialog.forceClose();
    this.categoriesChanged.emit();
  }

  protected onEditClosed(form: CategoryForm): void {
    form.reset();
    this.selectedCategory.set(null);
  }

  protected openDeleteDialog(category: Category, dialog: DeleteConfirmationDialog): void {
    this.responseError.set('');
    this.selectedCategory.set(category);
    dialog.open();
  }

  protected openEditDialog(category: Category, dialog: Dialog): void {
    this.selectedCategory.set(category);
    dialog.open();
  }

  protected confirmDelete(): void {
    const category = this.selectedCategory();

    if (!category || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.responseError.set('');

    this.categoryService
      .delete(category.id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.categoriesChanged.emit();
          this.deleteDialog().close();
          this.selectedCategory.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as ApiError;

          this.responseError.set(apiError?.message ?? 'Something went wrong.');
        },
      });
  }
}
