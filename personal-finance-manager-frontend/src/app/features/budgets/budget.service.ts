import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Budget, CreateBudget, UpdateBudget } from './budget.model';
import { API_BASE_URL } from '../../core/api/api.config';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/budgets`;

  getAll(year: number, month: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.apiUrl, {
      params: {
        year,
        month,
      },
    });
  }

  create(body: CreateBudget): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, body);
  }

  update(id: string, body: UpdateBudget): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
