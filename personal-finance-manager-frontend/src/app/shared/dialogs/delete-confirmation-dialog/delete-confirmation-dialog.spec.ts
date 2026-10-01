import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { CategoryList } from '../../../features/categories/category-list/category-list';
import { CategoryService } from '../../../features/categories/category.service';
import { TransactionList } from '../../../features/transactions/transaction-list/transaction-list';
import { TransactionService } from '../../../features/transactions/transaction.service';

describe('Delete confirmation integration', () => {
  const category = { id: 'category-1', name: 'Food', type: 'Expense' };
  const transaction = {
    id: 'transaction-1', description: 'Lunch', amount: 10,
    date: '2026-10-01', category,
  };
  let fixture: ComponentFixture<CategoryList | TransactionList>;
  let request: Subject<void>;
  let categoriesChanged = vi.fn<() => void>();
  let service: { getAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

  function modal(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('app-delete-confirmation-dialog dialog');
  }

  async function click(label: string) {
    Array.from(modal().querySelectorAll('button'))
      .find(button => button.textContent?.trim() === label)!.click();
    await fixture.whenStable();
  }

  async function open() {
    (fixture.nativeElement.querySelector('app-icon-button[icon="delete"] button') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  for (const kind of ['category', 'transaction'] as const) {
    describe(kind, () => {
      beforeEach(async () => {
        Object.defineProperties(HTMLDialogElement.prototype, {
          showModal: { configurable: true, value() { this.open = true; } },
          close: { configurable: true, value() { this.open = false; } },
        });
        request = new Subject<void>();
        service = {
          getAll: vi.fn(() => of(kind === 'category' ? [category] : [transaction])),
          delete: vi.fn(() => request.asObservable()),
        };
        await TestBed.configureTestingModule({
          imports: [CategoryList, TransactionList],
          providers: [
            { provide: CategoryService, useValue: service },
            { provide: TransactionService, useValue: service },
          ],
        }).compileComponents();
        fixture = kind === 'category'
          ? TestBed.createComponent(CategoryList)
          : TestBed.createComponent(TransactionList);
        fixture.componentRef.setInput('categories', [category]);
        categoriesChanged = vi.fn();
        if (fixture.componentInstance instanceof CategoryList) {
          fixture.componentInstance.categoriesChanged.subscribe(categoriesChanged);
        }
        if (kind === 'transaction') {
          fixture.componentRef.setInput('year', 2026);
          fixture.componentRef.setInput('month', 10);
        }
        await fixture.whenStable();
      });

      it('cancels without sending a delete request', async () => {
        await open();
        expect(modal().textContent).toContain(kind === 'category' ? 'Food' : 'Lunch');
        await click('Cancel');
        expect(modal().open).toBe(false);
        expect(service.delete).not.toHaveBeenCalled();
        expect(categoriesChanged).not.toHaveBeenCalled();
      });

      it('deletes the selected item and notifies the parent or refreshes only after success', async () => {
        await open();
        await click('Delete');
        expect(service.delete).toHaveBeenCalledExactlyOnceWith(`${kind}-1`);
        expect(modal().open).toBe(true);
        expect(modal().querySelector<HTMLButtonElement>('.btn-danger')!.disabled).toBe(true);
        await click('Cancel');
        modal().dispatchEvent(new Event('cancel', { cancelable: true }));
        await fixture.whenStable();
        expect(modal().open).toBe(true);
        expect(service.getAll).toHaveBeenCalledTimes(kind === 'category' ? 0 : 1);
        expect(categoriesChanged).not.toHaveBeenCalled();
        service.getAll.mockReturnValue(of([]));
        request.next();
        request.complete();
        await fixture.whenStable();
        expect(modal().open).toBe(false);
        if (kind === 'category') {
          expect(categoriesChanged).toHaveBeenCalledTimes(1);
          expect(service.getAll).not.toHaveBeenCalled();
          // Dashboard supplies the refreshed list after receiving the output.
          fixture.componentRef.setInput('categories', []);
          await fixture.whenStable();
        } else {
          expect(service.getAll).toHaveBeenCalledTimes(2);
        }
        expect(fixture.nativeElement.querySelector('app-icon-button[icon="delete"]')).toBeNull();
      });

      it('keeps failures visible and allows retry', async () => {
        await open();
        await click('Delete');
        request.error(new HttpErrorResponse({ status: 409, error: { message: 'Cannot delete this item.' } }));
        await fixture.whenStable();
        expect(modal().open).toBe(true);
        expect(modal().querySelector('[role="alert"]')?.textContent).toContain('Cannot delete this item.');
        expect(modal().querySelector<HTMLButtonElement>('.btn-danger')!.disabled).toBe(false);
        expect(service.getAll).toHaveBeenCalledTimes(kind === 'category' ? 0 : 1);
        expect(categoriesChanged).not.toHaveBeenCalled();
        service.delete.mockReturnValue(of(undefined));
        await click('Delete');
        expect(service.delete).toHaveBeenCalledTimes(2);
        expect(modal().open).toBe(false);
        if (kind === 'category') {
          expect(categoriesChanged).toHaveBeenCalledTimes(1);
        }
      });
    });
  }
});
