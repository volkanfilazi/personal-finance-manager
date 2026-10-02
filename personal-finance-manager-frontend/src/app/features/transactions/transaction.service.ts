import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateTransaction, Transaction, UpdateTransaction } from './transaction.model';
import { API_BASE_URL } from '../../core/api/api.config';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/transactions`;

  getAll(year: number, month: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl, {
      params: {
        year,
        month,
      },
    });
  }

  create(body: CreateTransaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, body);
  }

  update(id: string, body: UpdateTransaction): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
