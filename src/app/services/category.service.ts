import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse, Category } from '../models/app.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = `${API_BASE_URL}/api/categories`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getStoreCategories(storeId: number, onlyVisible: boolean = false): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/store/${storeId}?onlyVisible=${onlyVisible}`);
  }

  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.baseUrl}/${id}`);
  }

  createCategory(category: {
    name: string;
    description?: string;
    storeId: number;
    parentCategoryId?: number | null;
    gridX?: number | null;
    gridY?: number | null;
    width?: number | null;
    height?: number | null;
    colorHex?: string | null;
    isVisible?: boolean;
  }): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.baseUrl, category, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateCategory(id: number, category: {
    name: string;
    description?: string;
    parentCategoryId?: number | null;
    gridX?: number | null;
    gridY?: number | null;
    width?: number | null;
    height?: number | null;
    colorHex?: string | null;
    isVisible: boolean;
  }): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.baseUrl}/${id}`, category, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updatePosition(id: number, pos: {
    gridX?: number | null;
    gridY?: number | null;
    width?: number | null;
    height?: number | null;
    colorHex?: string | null;
  }): Observable<ApiResponse<Category>> {
    return this.http.patch<ApiResponse<Category>>(`${this.baseUrl}/${id}/position`, pos, {
      headers: this.authService.getAuthHeaders()
    });
  }

  toggleVisibility(id: number, isVisible: boolean): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/${id}/visibility`, { isVisible }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteCategory(id: number, deleteProducts: boolean): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}?deleteProducts=${deleteProducts}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  saveMapLayout(storeId: number, layout: {
    entranceX?: number | null;
    entranceY?: number | null;
    categories: Array<{ categoryId: number; gridX?: number | null; gridY?: number | null }>;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/store/${storeId}/layout`, layout, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
