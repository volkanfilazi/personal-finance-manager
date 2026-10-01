import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../category.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../../core/api/api-error.model';
import { finalize, map } from 'rxjs';
import { Category } from '../category.model';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryForm {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  readonly saved = output<void>();
  readonly updateForm = input<Category | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    type: ['Expense' as 'Income' | 'Expense', Validators.required],
  });

  readonly loading = signal(false);
  protected responseError = signal<string>('');
  private readonly initialValue = signal(this.form.getRawValue());

  private readonly currentValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly hasChanges = computed(() => {
    const current = this.currentValue();
    const initial = this.initialValue();

    return (Object.keys(initial) as Array<keyof typeof initial>).some(
      (key) => current[key] !== initial[key],
    );
  });

  constructor() {
    effect(() => {
      const category = this.updateForm();

      const initial = { name: category?.name ?? '', type: category?.type ?? 'Expense' };
      this.initialValue.set(initial);
      this.form.reset(initial);
      this.responseError.set('');
    });
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      return;
    }

    this.loading.set(true);
    this.responseError.set('');

    const formValue = this.form.getRawValue();
    const category = this.updateForm();

    const request$ = category
      ? this.categoryService.update({
          id: category.id,
          name: formValue.name,
          type: formValue.type,
        })
      : this.categoryService.create(formValue);

    request$
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.initialValue.set(formValue);
          this.form.markAsPristine();
          this.saved.emit();
        },
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as ApiError;

          this.responseError.set(apiError?.message ?? 'Something went wrong. Please try again.');
        },
      });
  }

  reset(): void {
    const category = this.updateForm();

    const initial = {
      name: category?.name ?? '',
      type: category?.type ?? 'Expense',
    };

    this.initialValue.set(initial);
    this.form.reset(initial);
    this.responseError.set('');
  }
}
