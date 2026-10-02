import { Component, input } from '@angular/core';

@Component({
  selector: 'app-label',
  templateUrl: './label.html',
  styleUrl: './label.scss',
})
export class Label {
  readonly tone = input<'success' | 'danger'>('success');
}
