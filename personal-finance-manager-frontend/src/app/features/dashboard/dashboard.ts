import { Component } from '@angular/core';
import { CategoryList } from '../categories/category-list/category-list';

@Component({
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  imports: [CategoryList],
})
export class Dashboard {}
