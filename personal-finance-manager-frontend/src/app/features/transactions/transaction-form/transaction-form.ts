import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { finalize, map, Observable } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionService } from '../transaction.service';
import { Category } from '../../categories/category.model';
import { CreateTransaction, Transaction } from '../transaction.model';
import { ApiError } from '../../../core/api/api-error.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextButton } from '../../../shared/buttons/text-button/text-button';
import { Input } from '../../../shared/form-elements/input/input';
import { Select } from '../../../shared/form-elements/select/select';
import { Textarea } from '../../../shared/form-elements/textarea/textarea';
import { currencyPrecision } from '../../../shared/validators/currency-precision';

let nextFormId = 0;
@Component({
  selector: 'app-transaction-form',
  imports: [ReactiveFormsModule, TextButton, Input, Select, Textarea],
  templateUrl: './transaction-form.html',
})
export class TransactionForm {
  protected readonly formId = 'transaction-' + nextFormId++;
  private readonly fb = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);

  protected responseError = signal<string>('');
  readonly saved = output<void>();
  readonly updateForm = input<Transaction | null>(null);
  readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(200)]],
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01), currencyPrecision]),
    date: ['', [Validators.required]],
    categoryId: ['', Validators.required],
  });

  categories = input<Category[]>([]);
  protected readonly categoryOptions = computed(() =>
    this.categories().map(category => ({ value: category.id, label: category.name })),
  );

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
        this.initialValue.update((initial) => ({ ...initial, categoryId: firstCategory.id }));
      }
    });
  }

  reset(): void {
    const transaction = this.updateForm();

    this.form.reset({
      description: transaction?.description ?? '',
      amount: transaction?.amount ?? null,
      date: transaction ? formatDate(transaction.date, 'yyyy-MM-dd', 'en-US') : '',
      categoryId: transaction?.category.id ?? this.categories()[0]?.id ?? '',
    });

    this.initialValue.set(this.form.getRawValue());
    this.responseError.set('');
  }

  submit() {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const transaction = this.updateForm();
    const body: CreateTransaction = {
      description: value.description,
      amount: Number(value.amount),
      date: value.date,
      categoryId: value.categoryId,
    };

    this.loading.set(true);
    this.responseError.set('');

    const request$: Observable<Transaction | void> = transaction
      ? this.transactionService.update(transaction.id, body)
      : this.transactionService.create(body);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.saved.emit(),
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as ApiError | null;
        this.responseError.set(apiError?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
