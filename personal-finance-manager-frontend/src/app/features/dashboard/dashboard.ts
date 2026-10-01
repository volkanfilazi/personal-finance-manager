import { Component, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { CategoryList } from '../categories/category-list/category-list';
import { TransactionList } from '../transactions/transaction-list/transaction-list';
import { CategoryService } from '../categories/category.service';
import { Category } from '../categories/category.model';

@Component({
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  imports: [CategoryList, TransactionList],
})
export class Dashboard implements OnInit {
  protected readonly transactionList = viewChild.required<TransactionList>('transactionList');

  private readonly transactionService = inject(CategoryService);
  protected readonly selectedDate = signal(new Date());
  protected readonly categories = signal<Category[]>([]);

  categoryChanged() {
    this.loadCategories();
    this.transactionList().loadTransactions();
  }

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.transactionService.getAll().subscribe((categories) => {
      this.categories.set(categories);
    });
  }
}
