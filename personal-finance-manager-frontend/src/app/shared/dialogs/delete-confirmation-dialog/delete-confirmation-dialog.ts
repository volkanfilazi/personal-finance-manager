import { Component, input, output, viewChild } from '@angular/core';
import { Dialog } from '../dialog/dialog';

@Component({
  selector: 'app-delete-confirmation-dialog',
  templateUrl: './delete-confirmation-dialog.html',
  imports: [Dialog],
})
export class DeleteConfirmationDialog {
  itemName = input<string>('');
  loading = input<boolean>(false);
  error = input<string>('');

  readonly confirmed = output<void>();
  readonly closed = output<void>();
  private readonly dialog = viewChild.required(Dialog);

  open(): void {
    this.dialog().open();
  }

  close(): void {
    this.dialog().forceClose();
  }

  protected confirmDelete(): void {
    if (this.loading()) {
      return;
    }

    this.confirmed.emit();
  }
}
