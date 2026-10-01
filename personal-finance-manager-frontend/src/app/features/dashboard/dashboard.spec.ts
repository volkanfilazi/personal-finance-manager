import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Transaction } from '../transactions/transaction.model';
import { CategoryType } from '../categories/category.model';
import { Dashboard } from './dashboard';
import { CategoryService } from '../categories/category.service';
import { TransactionService } from '../transactions/transaction.service';
import { BudgetService } from '../budgets/budget.service';

describe('Dashboard month navigation', () => {
  let fixture: ComponentFixture<Dashboard>;
  let transactions: { getAll: ReturnType<typeof vi.fn> };
  let budgets: { getAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    transactions = { getAll: vi.fn(() => of([])) };
    budgets = { getAll: vi.fn(() => of([])) };
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: CategoryService, useValue: { getAll: vi.fn(() => of([])) } },
        { provide: TransactionService, useValue: transactions },
        { provide: BudgetService, useValue: budgets },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Dashboard);
  });

  const records: Transaction[] = [
    { id: '1', amount: 3500, date: '2026-10-01', description: 'Salary', category: { id: 'income', name: 'Salary', type: CategoryType.Income } },
    { id: '2', amount: 1482.5, date: '2026-10-01', description: 'Expenses', category: { id: 'expenses', name: 'Food', type: CategoryType.Expense } },
  ];

  function summary(): HTMLElement {
    return fixture.nativeElement.querySelector('.totals-summary');
  }

  async function nextMonth() {
    (fixture.nativeElement.querySelector('[aria-label="Next month"]') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  it('shows loading until data arrives, then formats income, expenses and balance', async () => {
    const pending = new Subject<Transaction[]>();
    transactions.getAll.mockReturnValue(pending.asObservable());
    await fixture.whenStable();
    expect(summary().getAttribute('aria-busy')).toBe('true');
    expect(summary().querySelectorAll('.total-card p').length).toBe(3);
    expect(summary().textContent).not.toContain('€0.00');
    pending.next(records);
    pending.complete();
    await fixture.whenStable();
    expect(summary().getAttribute('aria-busy')).toBe('false');
    expect(Array.from(summary().querySelectorAll('.total-card p')).map(p => p.textContent?.trim()))
      .toEqual(['€3,500.00', '€1,482.50', '€2,017.50']);
    const spending: HTMLElement = fixture.nativeElement.querySelector('app-spending-by-category');
    expect(spending.textContent).toContain('Food');
    expect(spending.textContent).toContain('€1,482.50');
    expect(spending.textContent).not.toContain('Salary');
    expect(transactions.getAll).toHaveBeenCalledTimes(1);
  });

  it('hides old totals during month changes and failures, then retries with an empty month', async () => {
    transactions.getAll.mockReturnValue(of(records));
    await fixture.whenStable();
    expect(summary().textContent).toContain('€3,500.00');
    const pending = new Subject<Transaction[]>();
    transactions.getAll.mockReturnValue(pending.asObservable());
    await nextMonth();
    expect(summary().textContent).not.toContain('€3,500.00');
    expect(summary().querySelector('[role="status"]')).not.toBeNull();
    pending.error(new Error('Unavailable'));
    await fixture.whenStable();
    expect(summary().getAttribute('aria-busy')).toBe('false');
    expect(summary().querySelector('[role="alert"]')).not.toBeNull();
    expect(summary().textContent).not.toContain('€0.00');
    expect(fixture.nativeElement.querySelector('app-spending-by-category .spending-row')).toBeNull();
    expect(fixture.nativeElement.querySelector('.transactions tbody').textContent).not.toContain('Salary');
    transactions.getAll.mockReturnValue(of([]));
    summary().querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(summary().querySelector('[role="alert"]')).toBeNull();
    expect(Array.from(summary().querySelectorAll('.total-card p')).map(p => p.textContent?.trim()))
      .toEqual(['€0.00', '€0.00', '€0.00']);
  });

  it('ignores cancelled month responses and supports a negative balance', async () => {
    await fixture.whenStable();
    const oldMonth = new Subject<Transaction[]>();
    const newMonth = new Subject<Transaction[]>();
    transactions.getAll.mockReturnValueOnce(oldMonth.asObservable()).mockReturnValueOnce(newMonth.asObservable());
    await nextMonth();
    await nextMonth();
    oldMonth.next(records);
    oldMonth.complete();
    await fixture.whenStable();
    expect(summary().getAttribute('aria-busy')).toBe('true');
    expect(summary().textContent).not.toContain('€3,500.00');
    newMonth.next([records[1]]);
    newMonth.complete();
    await fixture.whenStable();
    expect(summary().textContent).toContain('-€1,482.50');
  });

  it('refreshes budgets and spending when categories change, and reports category load errors', async () => {
    transactions.getAll.mockReturnValue(of(records));
    await fixture.whenStable();
    const categories = TestBed.inject(CategoryService);
    const pending = new Subject<never[]>();
    vi.mocked(categories.getAll).mockReturnValueOnce(pending);
    fixture.componentInstance.categoryChanged();
    await fixture.whenStable();
    expect(budgets.getAll).toHaveBeenCalledTimes(2);
    expect(transactions.getAll).toHaveBeenCalledTimes(2);
    pending.error(new Error('Unavailable'));
    await fixture.whenStable();
    const categoryCard: HTMLElement = fixture.nativeElement.querySelector('.categories');
    expect(categoryCard.querySelector('[role="alert"]')?.textContent).toContain('Categories could not be loaded');
    categoryCard.querySelector<HTMLButtonElement>('app-text-button button')!.click();
    await fixture.whenStable();
    expect(categoryCard.querySelector('[role="alert"]')).toBeNull();
  });

  it.each([
    { start: new Date(2026, 9, 31), direction: 'Previous', label: 'September 2026', year: 2026, month: 9 },
    { start: new Date(2026, 0, 31), direction: 'Next', label: 'February 2026', year: 2026, month: 2 },
    { start: new Date(2026, 11, 31), direction: 'Next', label: 'January 2027', year: 2027, month: 1 },
    { start: new Date(2026, 0, 1), direction: 'Previous', label: 'December 2025', year: 2025, month: 12 },
  ])('navigates to $label and refreshes both lists once', async ({ start, direction, label, year, month }) => {
    fixture.componentInstance['selectedDate'].set(start);
    await fixture.whenStable();
    expect(transactions.getAll).toHaveBeenCalledTimes(1);
    expect(budgets.getAll).toHaveBeenCalledTimes(1);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(`[aria-label="${direction} month"]`);
    button.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.selected-month').textContent.trim()).toBe(label);
    expect(transactions.getAll).toHaveBeenLastCalledWith(year, month);
    expect(budgets.getAll).toHaveBeenLastCalledWith(year, month);
    expect(transactions.getAll).toHaveBeenCalledTimes(2);
    expect(budgets.getAll).toHaveBeenCalledTimes(2);
  });
});
