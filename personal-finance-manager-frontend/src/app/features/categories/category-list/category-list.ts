import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CategoryService } from '../category.service';
import { Category } from '../category.model';
import { CategoryForm } from '../category-form/category-form';
import { Dialog } from '../../../shared/dialog/dialog';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { ApiError } from '../../../core/api/api-error.model';

type CategoryFormMode = 'create' | 'edit';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
  imports: [CategoryForm, Dialog, IconButton],
})
export class CategoryList implements OnInit {
  protected readonly confirmationDialog = viewChild.required<Dialog>('confirmationDialog');
  protected readonly editForm = viewChild.required<CategoryForm>('editForm');
  protected readonly createForm = viewChild.required<CategoryForm>('createForm');

  protected readonly activeFormMode = signal<CategoryFormMode | null>(null);

  private readonly categoryService = inject(CategoryService);

  protected readonly categoryDialog = viewChild.required<Dialog>('categoryDialog');
  protected readonly deleteDialog = viewChild.required<Dialog>('deleteDialog');
  protected readonly editDialog = viewChild.required<Dialog>('editDialog');

  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedCategory = signal<Category | null>(null);
  protected readonly deleting = signal(false);
  protected readonly responseError = signal('');

  ngOnInit(): void {
    this.loadCategories();
  }

  protected saveChanges(): void {
    this.confirmationDialog().close();

    if (this.activeFormMode() === 'create') {
      this.createForm().submit();
      return;
    }

    if (this.activeFormMode() === 'edit') {
      this.editForm().submit();
    }
  }

  protected discardChanges(): void {
    this.confirmationDialog().close();

    if (this.activeFormMode() === 'create') {
      this.categoryDialog().forceClose();
    }

    if (this.activeFormMode() === 'edit') {
      this.editDialog().forceClose();
    }

    this.activeFormMode.set(null);
  }

  protected openConfirmation(mode: CategoryFormMode): void {
    const form = mode === 'create' ? this.createForm() : this.editForm();
    if (form.loading()) return;

    this.activeFormMode.set(mode);
    this.confirmationDialog().open();
  }

  protected onCategorySaved(dialog: Dialog): void {
    dialog.forceClose();
    this.loadCategories();
  }

  protected onFormClosed(mode: CategoryFormMode): void {
    const form = mode === 'create' ? this.createForm() : this.editForm();
    form.reset();
    if (mode === 'edit') this.selectedCategory.set(null);
    this.activeFormMode.set(null);
  }

  protected openDeleteDialog(category: Category, dialog: Dialog): void {
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

    if (!category) {
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
          this.loadCategories();
          this.deleteDialog().close();
          this.selectedCategory.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as ApiError;

          this.responseError.set(apiError?.message ?? 'Something went wrong.');
        },
      });
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe((categories) => {
      this.categories.set(categories);
    });
  }
}
