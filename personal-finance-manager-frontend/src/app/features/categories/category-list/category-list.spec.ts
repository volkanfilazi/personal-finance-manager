import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { Category } from '../category.model';
import { CategoryService } from '../category.service';
import { CategoryForm } from '../category-form/category-form';
import { CategoryList } from './category-list';

describe('Category dialog flow', () => {
  const category: Category = { id: '1', name: 'Food', type: 'Expense' };
  let fixture: ComponentFixture<CategoryList>;
  let request: Subject<Category>;
  let categoriesChanged = vi.fn<() => void>();
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
    request = new Subject<Category>();
    service = {
      getAll: vi.fn(() => of([category])),
      create: vi.fn(() => request.asObservable()),
      update: vi.fn(() => request.asObservable()),
    };
    await TestBed.configureTestingModule({
      imports: [CategoryList],
      providers: [{ provide: CategoryService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoryList);
    fixture.componentRef.setInput('categories', [category]);
    categoriesChanged = vi.fn();
    fixture.componentInstance.categoriesChanged.subscribe(categoriesChanged);
    await fixture.whenStable();
  });

  function dialog(title: string): HTMLDialogElement {
    return Array.from(
      fixture.nativeElement.querySelectorAll('dialog') as NodeListOf<HTMLDialogElement>,
    ).find((element) => element.querySelector('h2')?.textContent?.trim() === title)!;
  }

  async function click(element: HTMLElement) {
    element.click();
    await fixture.whenStable();
  }

  async function confirmationAction(label: string) {
    const button = Array.from(dialog('Confirmation Dialog').querySelectorAll('button')).find(
      (element) => element.textContent?.trim() === label,
    )!;
    await click(button);
  }

  async function changeName(element: HTMLDialogElement, value: string) {
    const input = element.querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  for (const mode of ['create', 'edit'] as const) {
    describe(mode, () => {
      const title = mode === 'create' ? 'Create category' : 'Edit category';
      const original = mode === 'create' ? '' : category.name;

      async function open() {
        await click(
          fixture.nativeElement.querySelector(
            mode === 'create' ? 'main > header button' : 'app-icon-button[icon="edit"]',
          ),
        );
        return dialog(title);
      }

      function form(): CategoryForm {
        return fixture.debugElement.queryAll(By.directive(CategoryForm))[mode === 'create' ? 0 : 1]
          .componentInstance;
      }

      it('saves from confirmation and closes only after success', async () => {
        const modal = await open();
        await changeName(modal, 'Travel');
        await click(modal.querySelector('.dialog-close')!);
        expect(dialog('Confirmation Dialog').open).toBe(true);
        await confirmationAction('Save');
        expect(service[mode === 'create' ? 'create' : 'update']).toHaveBeenCalledWith(
          mode === 'create' ? { name: 'Travel', type: 'Expense' } : { ...category, name: 'Travel' },
        );
        expect(modal.open).toBe(true);
        expect(form().hasChanges()).toBe(true);
        expect(modal.querySelector('fieldset')!.disabled).toBe(true);
        form().submit();
        expect(service[mode === 'create' ? 'create' : 'update']).toHaveBeenCalledTimes(1);
        expect(categoriesChanged).not.toHaveBeenCalled();
        request.next({ ...category, name: 'Travel' });
        request.complete();
        await fixture.whenStable();
        expect(modal.open).toBe(false);
        expect(dialog('Confirmation Dialog').open).toBe(false);
        expect(form().hasChanges()).toBe(false);
        expect(categoriesChanged).toHaveBeenCalledTimes(1);
        expect(service.getAll).not.toHaveBeenCalled();
      });

      it('keeps changes after an API error and asks again before closing', async () => {
        const modal = await open();
        await changeName(modal, 'Travel');
        await click(modal.querySelector('.dialog-close')!);
        await confirmationAction('Save');
        request.error(new HttpErrorResponse({ status: 500, error: null }));
        await fixture.whenStable();
        expect(modal.open).toBe(true);
        expect(modal.querySelector('input')!.value).toBe('Travel');
        expect(form().hasChanges()).toBe(true);
        expect(modal.textContent).toContain('Something went wrong. Please try again.');
        expect(categoriesChanged).not.toHaveBeenCalled();
        await click(modal.querySelector('.dialog-close')!);
        expect(dialog('Confirmation Dialog').open).toBe(true);
      });

      it('restores initial values after Discard and reopening', async () => {
        const modal = await open();
        await changeName(modal, 'Travel');
        await click(modal.querySelector('.dialog-close')!);
        await confirmationAction('Discard');
        expect(modal.open).toBe(false);
        await open();
        expect(modal.querySelector('input')!.value).toBe(original);
        expect(form().hasChanges()).toBe(false);
        expect(service[mode === 'create' ? 'create' : 'update']).not.toHaveBeenCalled();
        expect(categoriesChanged).not.toHaveBeenCalled();
      });

      it('preserves invalid changes when confirmation Save is clicked', async () => {
        const modal = await open();
        await changeName(modal, 'x'.repeat(51));
        await click(modal.querySelector('.dialog-close')!);
        await confirmationAction('Save');
        expect(modal.open).toBe(true);
        expect(form().hasChanges()).toBe(true);
        expect(modal.textContent).toContain('Maximum 50 characters.');
        expect(service[mode === 'create' ? 'create' : 'update']).not.toHaveBeenCalled();
      });
    });
  }

  it('keeps create and edit change state independent and guards Escape', async () => {
    await click(fixture.nativeElement.querySelector('main > header button'));
    const modal = dialog('Create category');
    await changeName(modal, 'Travel');
    const forms = fixture.debugElement.queryAll(By.directive(CategoryForm));
    expect(forms[0].componentInstance.hasChanges()).toBe(true);
    expect(forms[1].componentInstance.hasChanges()).toBe(false);
    const cancel = new Event('cancel', { cancelable: true });
    modal.dispatchEvent(cancel);
    await fixture.whenStable();
    expect(cancel.defaultPrevented).toBe(true);
    expect(modal.open).toBe(true);
    expect(dialog('Confirmation Dialog').open).toBe(true);
    await confirmationAction('Cancel');
    expect(modal.querySelector('input')!.value).toBe('Travel');
  });
});
