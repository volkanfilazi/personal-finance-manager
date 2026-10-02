import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CreateCategory } from './category.model';
import { API_BASE_URL } from '../../core/api/api.config';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/categories`;

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  create(body: CreateCategory): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, body);
  }

  update(body: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${body.id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
