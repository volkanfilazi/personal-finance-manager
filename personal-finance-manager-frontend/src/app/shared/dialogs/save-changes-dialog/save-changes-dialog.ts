import { Component, viewChild } from '@angular/core';
import { Dialog } from '../dialog/dialog';

interface SaveableForm {
  loading(): boolean;
  submit(): void;
}

@Component({
  selector: 'app-save-changes-dialog',
  imports: [Dialog],
  templateUrl: './save-changes-dialog.html',
})
export class SaveChangesDialog {
  protected readonly dialog = viewChild.required(Dialog);
  private activeTarget: { form: SaveableForm; dialog: Dialog } | null = null;

  open(form: SaveableForm, dialog: Dialog): void {
    if (form.loading()) {
      return;
    }

    this.activeTarget = { form, dialog };
    this.dialog().open();
  }

  protected clearTarget(): void {
    this.activeTarget = null;
  }

  protected saveChanges(): void {
    const target = this.activeTarget;
    this.dialog().close();
    target?.form.submit();
  }

  protected discardChanges(): void {
    const target = this.activeTarget;
    this.dialog().close();
    target?.dialog.forceClose();
  }
}
