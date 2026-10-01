import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormGroupDirective } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { BudgetList } from './budget-list';
import { BudgetService } from '../budget.service';
import { Budget } from '../budget.model';
import { BudgetForm } from '../budget-form/budget-form';

describe('Budget dialog flows', () => {
  const budget: Budget = {
    id: 'budget-1', amount: 100, spent: 30, year: 2026, month: 10,
    category: { id: 'food', name: 'Food', type: 'Expense' },
  };
  let fixture: ComponentFixture<BudgetList>;
  let request: Subject<Budget | void>;
  let service: { getAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value() { this.open = true; } },
      close: { configurable: true, value() { this.open = false; } },
    });
    request = new Subject<Budget | void>();
    service = {
      getAll: vi.fn(() => of([budget])),
      create: vi.fn(() => request.asObservable()),
      update: vi.fn(() => request.asObservable()),
      delete: vi.fn(() => request.asObservable()),
    };
    await TestBed.configureTestingModule({
      imports: [BudgetList], providers: [{ provide: BudgetService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(BudgetList);
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('month', 10);
    fixture.componentRef.setInput('categories', [budget.category]);
    await fixture.whenStable();
  });

  function dialog(title: string): HTMLDialogElement {
    return Array.from(fixture.nativeElement.querySelectorAll('dialog') as NodeListOf<HTMLDialogElement>)
      .find(element => element.querySelector('h2')?.textContent?.trim() === title)!;
  }

  async function click(element: HTMLElement) {
    element.click();
    await fixture.whenStable();
  }

  async function action(title: string, label: string) {
    await click(Array.from(dialog(title).querySelectorAll('button')).find(button => button.textContent?.trim() === label)!);
  }

  async function openEdit() {
    await click(fixture.nativeElement.querySelector('app-icon-button[icon="edit"] button'));
    const debug = fixture.debugElement.queryAll(By.directive(BudgetForm))[1];
    return {
      component: debug.componentInstance as BudgetForm,
      form: debug.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective).form,
    };
  }

  it('fills edit fields, locks category/month and saves the amount from confirmation', async () => {
    const { component, form } = await openEdit();
    expect(form.getRawValue()).toEqual({ amount: 100, categoryId: 'food', monthYear: '2026-10' });
    expect(form.controls['categoryId'].disabled).toBe(true);
    expect(form.controls['monthYear'].disabled).toBe(true);
    expect(component.hasChanges()).toBe(false);
    form.patchValue({ amount: 150 });
    await fixture.whenStable();
    await click(dialog('Edit budget').querySelector('.dialog-close')!);
    expect(dialog('Confirmation Dialog').open).toBe(true);
    await action('Confirmation Dialog', 'Save');
    expect(service.update).toHaveBeenCalledExactlyOnceWith('budget-1', { amount: 150 });
    expect(service.create).not.toHaveBeenCalled();
    component.submit();
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(true);
    request.next();
    request.complete();
    await fixture.whenStable();
    expect(dialog('Edit budget').open).toBe(false);
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('keeps edits on failure and restores the original amount after Discard', async () => {
    const { component, form } = await openEdit();
    form.patchValue({ amount: 150 });
    component.submit();
    request.error(new HttpErrorResponse({ status: 500 }));
    await fixture.whenStable();
    expect(component.loading()).toBe(false);
    expect(form.controls['amount'].value).toBe(150);
    expect(dialog('Edit budget').textContent).toContain('Budget could not be saved.');
    await click(dialog('Edit budget').querySelector('.dialog-close')!);
    await action('Confirmation Dialog', 'Discard');
    const reopened = await openEdit();
    expect(reopened.form.controls['amount'].value).toBe(100);
    expect(reopened.component.hasChanges()).toBe(false);
  });

  it('preserves create mode and posts the selected period and category', async () => {
    await click(fixture.nativeElement.querySelector('header button'));
    const debug = fixture.debugElement.queryAll(By.directive(BudgetForm))[0];
    const component = debug.componentInstance as BudgetForm;
    const form = debug.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective).form;
    expect(component.hasChanges()).toBe(false);
    expect(form.controls['categoryId'].enabled).toBe(true);
    form.setValue({ amount: 80, categoryId: 'food', monthYear: '2026-11' });
    component.submit();
    expect(service.create).toHaveBeenCalledExactlyOnceWith({ amount: 80, categoryId: 'food', year: 2026, month: 11 });
    request.next({ ...budget, month: 11, amount: 80 });
    request.complete();
    await fixture.whenStable();
    expect(dialog('Add budget').open).toBe(false);
  });

  it('cancels deletion without a request, then deletes and refreshes after confirmation', async () => {
    const button = fixture.nativeElement.querySelector('app-icon-button[icon="delete"] button');
    await click(button);
    await action('Confirm deletion', 'Cancel');
    expect(service.delete).not.toHaveBeenCalled();
    await click(button);
    await action('Confirm deletion', 'Delete');
    expect(service.delete).toHaveBeenCalledExactlyOnceWith('budget-1');
    expect(dialog('Confirm deletion').open).toBe(true);
    service.getAll.mockReturnValue(of([]));
    request.next();
    request.complete();
    await fixture.whenStable();
    expect(dialog('Confirm deletion').open).toBe(false);
    expect(service.getAll).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('app-icon-button[icon="delete"]')).toBeNull();
  });

  it('shows deletion failures and permits retry', async () => {
    await click(fixture.nativeElement.querySelector('app-icon-button[icon="delete"] button'));
    await action('Confirm deletion', 'Delete');
    request.error(new HttpErrorResponse({ status: 409, error: { message: 'Cannot delete budget.' } }));
    await fixture.whenStable();
    expect(dialog('Confirm deletion').open).toBe(true);
    expect(dialog('Confirm deletion').textContent).toContain('Cannot delete budget.');
    expect(service.getAll).toHaveBeenCalledTimes(1);
    service.delete.mockReturnValue(of(undefined));
    await action('Confirm deletion', 'Delete');
    expect(service.delete).toHaveBeenCalledTimes(2);
    expect(dialog('Confirm deletion').open).toBe(false);
  });
});
