import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../../core/api/api-error.model';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetService } from '../budget.service';
import { Budget, CreateBudget } from '../budget.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map, Observable } from 'rxjs';
import { Category } from '../../categories/category.model';

@Component({
  selector: 'app-budget-form',
  imports: [ReactiveFormsModule],
  templateUrl: './budget-form.html',
})
export class BudgetForm {
  private readonly fb = inject(FormBuilder);
  private readonly budgetService = inject(BudgetService);
  protected responseError = signal<string>('');
  readonly saved = output<void>();
  readonly loading = signal(false);
  readonly updateForm = input<Budget | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    categoryId: ['', Validators.required],
    monthYear: ['', Validators.required],
  });

  categories = input<Category[]>([]);

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
      this.updateForm();
      untracked(() => this.reset());
    });

    effect(() => {
      const firstCategory = this.categories()[0];
      const control = this.form.controls.categoryId;

      if (!this.updateForm() && firstCategory && !control.value) {
        control.setValue(firstCategory.id);
        this.initialValue.update(initial => ({ ...initial, categoryId: firstCategory.id }));
      }
    });
  }

  reset() {
    const budget = this.updateForm();

    this.form.reset({
      amount: budget?.amount ?? null,
      categoryId: budget?.category.id ?? this.categories()[0]?.id ?? '',
      monthYear: budget ? `${budget.year}-${String(budget.month).padStart(2, '0')}` : '',
    });

    // The update endpoint only accepts the amount.
    for (const control of [this.form.controls.categoryId, this.form.controls.monthYear]) {
      if (budget) control.disable();
      else control.enable();
    }
    this.initialValue.set(this.form.getRawValue());
    this.responseError.set('');
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const budget = this.updateForm();

    const [year, month] = value.monthYear.split('-').map(Number);

    const body: CreateBudget = {
      amount: Number(value.amount),
      categoryId: value.categoryId,
      year,
      month,
    };

    this.loading.set(true);
    this.responseError.set('');
    const request$: Observable<Budget | void> = budget
      ? this.budgetService.update(budget.id, { amount: body.amount })
      : this.budgetService.create(body);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.initialValue.set(this.form.getRawValue());
        this.saved.emit();
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as ApiError | null;
        this.responseError.set(apiError?.message ?? 'Budget could not be saved. Please try again.');
      },
    });
  }
}
