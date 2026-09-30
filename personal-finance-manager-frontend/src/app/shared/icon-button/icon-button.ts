import { Component, input } from '@angular/core';

export type IconButtonIcon = 'edit' | 'delete';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
})
export class IconButton {
  readonly icon = input.required<IconButtonIcon>();
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly loading = input(false);
}
