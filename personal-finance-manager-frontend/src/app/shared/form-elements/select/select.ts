import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../form-field/form-field';

@Component({
  selector: 'app-select',
  templateUrl: './select.html',
  imports: [ReactiveFormsModule, FormField],
})
export class Select<T extends string> {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<T>>();
  readonly options = input.required<ReadonlyArray<{ value: T; label: string }>>();
  readonly error = input('');
}
