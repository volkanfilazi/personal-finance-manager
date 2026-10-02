import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../form-field/form-field';

@Component({
  selector: 'app-input',
  templateUrl: './input.html',
  imports: [ReactiveFormsModule, FormField],
})
export class Input<T> {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'number' | 'text' | 'month' | 'date'>('text');
  readonly min = input<number | string | null>(null);
  readonly max = input<number | string | null>(null);
  readonly step = input<number | 'any' | null>(null);
  readonly control = input.required<FormControl<T>>();
  readonly error = input('');
}
