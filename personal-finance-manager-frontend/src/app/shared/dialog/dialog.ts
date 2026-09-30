import { Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  readonly hasChanges = input<boolean>(false);
  readonly title = input.required<string>();
  readonly closed = output<void>();
  readonly closeBlocked = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open() {
    this.dialog().nativeElement.showModal();
  }

  close() {
    if (this.hasChanges()) {
      this.closeBlocked.emit();
      return;
    }

    this.closeDialog();
  }

  forceClose() {
    this.closeDialog();
  }

  private closeDialog() {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }
}
