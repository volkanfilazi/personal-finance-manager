import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CreateCategory } from './category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>('http://localhost:5271/api/categories');
  }

  create(body: CreateCategory): Observable<Category> {
    return this.http.post<Category>('http://localhost:5271/api/categories', body);
  }

  update(body: Category): Observable<Category> {
    return this.http.put<Category>(`http://localhost:5271/api/categories/${body.id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`http://localhost:5271/api/categories/${id}`);
  }
}
