import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { Category } from '../../categories/category.model';
import { Transaction } from '../transaction.model';
import { TransactionService } from '../transaction.service';
import { TransactionForm } from '../transaction-form/transaction-form';
import { TransactionList } from './transaction-list';

describe('Transaction create and edit', () => {
  const categories: Category[] = [
    { id: 'food', name: 'Food', type: 'Expense' },
    { id: 'travel', name: 'Travel', type: 'Expense' },
  ];
  const transaction: Transaction = {
    id: 'transaction-1',
    description: 'Train ticket',
    amount: 12.5,
    date: '2026-09-30T00:00:00',
    category: categories[1],
  };
  let fixture: ComponentFixture<TransactionList>;
  let request: Subject<Transaction | void>;
  let service: {
    getAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value() {
          this.open = true;
        },
      },
      close: {
        configurable: true,
        value() {
          this.open = false;
        },
      },
    });
    request = new Subject<Transaction | void>();
    service = {
      getAll: vi.fn(() => of([transaction])),
      create: vi.fn(() => request.asObservable()),
      update: vi.fn(() => request.asObservable()),
    };
    await TestBed.configureTestingModule({
      imports: [TransactionList],
      providers: [{ provide: TransactionService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(TransactionList);
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('month', 9);
    fixture.componentRef.setInput('categories', categories);
    await fixture.whenStable();
  });

  async function open(edit: boolean) {
    const button: HTMLElement = fixture.nativeElement.querySelector(
      edit ? 'app-icon-button[icon="edit"] button' : 'main > header button',
    );
    button.click();
    await fixture.whenStable();
    const element = fixture.debugElement.queryAll(By.directive(TransactionForm))[edit ? 1 : 0];
    return {
      component: element.componentInstance as TransactionForm,
      form: element.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective).form,
      modal: (element.nativeElement as HTMLElement).closest('dialog')!,
    };
  }

  function confirmation(): HTMLDialogElement {
    return Array.from(
      fixture.nativeElement.querySelectorAll('dialog') as NodeListOf<HTMLDialogElement>,
    ).find((dialog) => dialog.querySelector('h2')?.textContent?.trim() === 'Confirmation Dialog')!;
  }

  async function choose(action: string) {
    Array.from(confirmation().querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === action)!
      .click();
    await fixture.whenStable();
  }

  for (const edit of [false, true]) {
    it(`confirms closing changed ${edit ? 'edit' : 'create'} forms and supports Cancel and Discard`, async () => {
      const { form, modal, component } = await open(edit);
      const initial = form.getRawValue();
      form.patchValue({ description: 'Unsaved text' });
      await fixture.whenStable();
      (modal.querySelector('.dialog-close') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(confirmation().open).toBe(true);
      expect(modal.open).toBe(true);
      await choose('Cancel');
      expect(modal.open).toBe(true);
      expect(form.controls['description'].value).toBe('Unsaved text');
      modal.dispatchEvent(new Event('cancel', { cancelable: true }));
      await fixture.whenStable();
      expect(confirmation().open).toBe(true);
      await choose('Discard');
      expect(modal.open).toBe(false);
      expect(component.hasChanges()).toBe(false);
      const reopened = await open(edit);
      expect(reopened.form.getRawValue()).toEqual(initial);
      expect(service.create).not.toHaveBeenCalled();
      expect(service.update).not.toHaveBeenCalled();
    });

    it(`saves the correct ${edit ? 'edit' : 'create'} form from confirmation`, async () => {
      const { form, modal } = await open(edit);
      const body = { description: 'Save me', amount: 10, date: '2026-09-30', categoryId: 'food' };
      form.setValue(body);
      await fixture.whenStable();
      (modal.querySelector('.dialog-close') as HTMLButtonElement).click();
      await fixture.whenStable();
      await choose('Save');
      if (edit) expect(service.update).toHaveBeenCalledWith(transaction.id, body);
      else expect(service.create).toHaveBeenCalledWith(body);
      expect(modal.open).toBe(true);
      request.next(edit ? undefined : { ...transaction, ...body });
      request.complete();
      await fixture.whenStable();
      expect(modal.open).toBe(false);
      expect(confirmation().open).toBe(false);
    });

    it(`${edit ? 'updates the selected transaction' : 'creates a transaction'} and refreshes after success`, async () => {
      const { form, modal, component } = await open(edit);
      expect(form.getRawValue()).toEqual(
        edit
          ? {
              description: 'Train ticket',
              amount: 12.5,
              date: '2026-09-30',
              categoryId: 'travel',
            }
          : { description: '', amount: null, date: '', categoryId: 'food' },
      );

      const body = {
        description: 'Updated ticket',
        amount: 20.75,
        date: '2026-09-29',
        categoryId: 'travel',
      };
      form.setValue(body);
      modal
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await fixture.whenStable();
      if (edit) {
        expect(service.update).toHaveBeenCalledWith(transaction.id, body);
        expect(service.create).not.toHaveBeenCalled();
      } else {
        expect(service.create).toHaveBeenCalledWith(body);
        expect(service.update).not.toHaveBeenCalled();
      }
      expect(modal.open).toBe(true);
      expect(component.loading()).toBe(true);
      component.submit();
      expect(edit ? service.update : service.create).toHaveBeenCalledTimes(1);
      request.next(edit ? undefined : { ...transaction, ...body });
      request.complete();
      await fixture.whenStable();
      expect(modal.open).toBe(false);
      expect(component.loading()).toBe(false);
      expect(service.getAll).toHaveBeenCalledTimes(2);
      expect(service.getAll).toHaveBeenLastCalledWith(2026, 9);
    });

    it(`preserves ${edit ? 'edit' : 'create'} values after an API failure`, async () => {
      const { form, modal, component } = await open(edit);
      const body = { description: 'Keep me', amount: 5, date: '2026-09-30', categoryId: 'food' };
      form.setValue(body);
      component.submit();
      request.error(
        new HttpErrorResponse({ status: 400, error: { message: 'Cannot save transaction.' } }),
      );
      await fixture.whenStable();
      expect(form.getRawValue()).toEqual(body);
      expect(modal.open).toBe(true);
      expect(modal.textContent).toContain('Cannot save transaction.');
      expect(component.loading()).toBe(false);
      expect(service.getAll).toHaveBeenCalledTimes(1);
    });
  }

  it.each([
    { year: 2026, month: 10, date: '2026-10-01' },
    { year: 2027, month: 1, date: '2027-01-01' },
  ])(
    'preserves the local calendar date across edit/save at $date',
    async ({ year, month, date }) => {
      // Local midnight is the previous UTC day in Europe/Vienna.
      const existing = {
        ...transaction,
        date: new Date(year, month - 1, 1).toISOString(),
      };
      service.getAll.mockReturnValue(of([existing]));
      fixture.destroy();
      fixture = TestBed.createComponent(TransactionList);
      fixture.componentRef.setInput('year', year);
      fixture.componentRef.setInput('month', month);
      fixture.componentRef.setInput('categories', categories);
      await fixture.whenStable();

      const { form, modal, component } = await open(true);
      expect(form.controls['date'].value).toBe(date);
      expect((modal.querySelector('input[type="date"]') as HTMLInputElement).value).toBe(date);
      expect(component.hasChanges()).toBe(false);
      form.patchValue({ description: 'Changed description only' });
      component.submit();
      expect(service.update).toHaveBeenCalledWith(transaction.id, {
        description: 'Changed description only',
        amount: 12.5,
        date,
        categoryId: 'travel',
      });
      request.next();
      request.complete();
      await fixture.whenStable();
      expect(service.getAll).toHaveBeenLastCalledWith(year, month);
    },
  );

  it('shows a table spinner until loading completes, then shows the empty state', async () => {
    const load = new Subject<Transaction[]>();
    service.getAll.mockReturnValue(load.asObservable());
    fixture.componentInstance.loadTransactions();
    await fixture.whenStable();
    const table: HTMLTableElement = fixture.nativeElement.querySelector('table');
    expect(table.getAttribute('aria-busy')).toBe('true');
    expect(table.querySelector('[role="status"]')).not.toBeNull();
    expect(table.textContent).not.toContain('No transactions found.');
    load.next([]);
    load.complete();
    await fixture.whenStable();
    expect(table.getAttribute('aria-busy')).toBe('false');
    expect(table.querySelector('[role="status"]')).toBeNull();
    expect(table.textContent).toContain('No transactions found.');
  });

  it('stops the spinner on error, preserves existing rows and allows retry', async () => {
    const load = new Subject<Transaction[]>();
    service.getAll.mockReturnValue(load.asObservable());
    fixture.componentInstance.loadTransactions();
    load.error(new HttpErrorResponse({ status: 500 }));
    await fixture.whenStable();
    const table: HTMLTableElement = fixture.nativeElement.querySelector('table');
    expect(table.getAttribute('aria-busy')).toBe('false');
    expect(table.querySelector('[role="status"]')).toBeNull();
    expect(table.querySelector('[role="alert"]')?.textContent).toContain(
      'Transactions could not be loaded.',
    );
    expect(table.textContent).toContain(transaction.description);
    service.getAll.mockReturnValue(of([transaction]));
    table.querySelector<HTMLButtonElement>('app-text-button button')!.click();
    await fixture.whenStable();
    expect(table.querySelector('[role="alert"]')).toBeNull();
    expect(table.textContent).toContain(transaction.description);
  });

  it('cancels an older load so it cannot overwrite the latest results', async () => {
    const oldLoad = new Subject<Transaction[]>();
    const newLoad = new Subject<Transaction[]>();
    service.getAll
      .mockReturnValueOnce(oldLoad.asObservable())
      .mockReturnValueOnce(newLoad.asObservable());
    fixture.componentInstance.loadTransactions();
    fixture.componentInstance.loadTransactions();
    oldLoad.next([transaction]);
    oldLoad.complete();
    await fixture.whenStable();
    const table: HTMLTableElement = fixture.nativeElement.querySelector('table');
    expect(table.getAttribute('aria-busy')).toBe('true');
    newLoad.next([{ ...transaction, description: 'Latest result' }]);
    newLoad.complete();
    await fixture.whenStable();
    expect(table.getAttribute('aria-busy')).toBe('false');
    expect(table.textContent).toContain('Latest result');
    expect(table.textContent).not.toContain(transaction.description);
  });

  it('does not submit an invalid form', async () => {
    const { component, form } = await open(false);
    component.submit();
    expect(form.touched).toBe(true);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('keeps edits during category refresh and restores data on reopening', async () => {
    const { form, modal } = await open(true);
    form.patchValue({ description: 'Unsaved text' });
    fixture.componentRef.setInput('categories', [...categories]);
    await fixture.whenStable();
    expect(form.controls['description'].value).toBe('Unsaved text');
    (modal.querySelector('.dialog-close') as HTMLButtonElement).click();
    await fixture.whenStable();
    await choose('Discard');
    const reopened = await open(true);
    expect(reopened.form.controls['description'].value).toBe(transaction.description);
    expect(reopened.form.controls['categoryId'].value).toBe(transaction.category.id);
    (reopened.modal.querySelector('.dialog-close') as HTMLButtonElement).click();
    await fixture.whenStable();
    const create = await open(false);
    expect(create.component.updateForm()).toBeNull();
    expect(create.form.controls['description'].value).toBe('');
  });
});
