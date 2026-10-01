import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../form-field/form-field';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.html',
  imports: [ReactiveFormsModule, FormField],
})
export class Textarea {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly rows = input(3);
  readonly error = input('');
}
