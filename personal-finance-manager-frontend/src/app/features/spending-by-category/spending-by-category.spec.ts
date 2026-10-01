import { TestBed } from '@angular/core/testing';
import { SpendingByCategory } from './spending-by-category';
import { CategoryType } from '../categories/category.model';
import { Transaction } from '../transactions/transaction.model';

describe('Spending by category', () => {
  const expense = (id: string, name: string, amount: number): Transaction => ({
    id: `${id}-${amount}`, description: name, amount, date: '2026-10-01',
    category: { id, name, type: CategoryType.Expense },
  });

  it('groups expenses by category id without budgets, sorts them and excludes income', async () => {
    const fixture = TestBed.createComponent(SpendingByCategory);
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput('transactions', [
      expense('food', 'Food', 100), expense('rent', 'Rent', 900),
      expense('food', 'Food', 200), expense('other-food', 'Food', 50),
      { ...expense('salary', 'Salary', 5000), category: { id: 'salary', name: 'Salary', type: CategoryType.Income } },
    ]);
    await fixture.whenStable();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.spending-row'));
    expect(rows.map(row => row.querySelector('.category-name')?.textContent)).toEqual(['Rent', 'Food', 'Food']);
    expect(rows.map(row => row.querySelector('.amount')?.textContent)).toEqual(['€900.00', '€300.00', '€50.00']);
    expect((rows[0].querySelector('.bar-fill') as HTMLElement).style.width).toBe('100%');
    expect(fixture.nativeElement.querySelector('.highest-spending').textContent).toContain('Rent');
    expect(fixture.nativeElement.textContent).not.toContain('Salary');
  });

  it('shows tied highest categories and handles empty, loading and retry states', async () => {
    const fixture = TestBed.createComponent(SpendingByCategory);
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput('transactions', [expense('a', 'Food', 0.1), expense('a', 'Food', 0.2), expense('b', 'Transport', 0.3)]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.highest-spending p').length).toBe(2);
    fixture.componentRef.setInput('status', 'loading');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.spending-row')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    fixture.componentRef.setInput('status', 'error');
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button').click();
    expect(retry).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('transactions', []);
    fixture.componentRef.setInput('status', 'ready');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No expenses for this month.');
    expect(fixture.nativeElement.querySelector('.highest-spending')).toBeNull();
  });
});
