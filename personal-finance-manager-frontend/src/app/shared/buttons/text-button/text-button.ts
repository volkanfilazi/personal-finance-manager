import { Component, input } from '@angular/core';

export type TextButtonVariant = 'primary' | 'secondary' | 'danger';

@Component({
  selector: 'app-text-button',
  templateUrl: './text-button.html',
  styleUrl: './text-button.scss',
})
export class TextButton {
  readonly label = input.required<string>();
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<TextButtonVariant>('primary');
  readonly disabled = input(false);
  readonly loading = input(false);
}
