import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse, Product } from '../models/app.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = `${API_BASE_URL}/api/products`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getStoreProducts(storeId: number, categoryId?: number | null, onlyVisible: boolean = false): Observable<ApiResponse<Product[]>> {
    let url = `${this.baseUrl}/store/${storeId}?onlyVisible=${onlyVisible}`;
    if (categoryId) {
      url += `&categoryId=${categoryId}`;
    }
    return this.http.get<ApiResponse<Product[]>>(url);
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/${id}`);
  }

  getProductByBarcode(storeId: number, barcode: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/store/${storeId}/barcode/${barcode}`);
  }

  createProduct(product: {
    name: string;
    description?: string;
    barcode: string;
    price: number;
    stock: number;
    isVisible?: boolean;
    storeId: number;
    categoryId?: number | null;
  }): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.baseUrl, product, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateProduct(id: number, product: {
    name: string;
    description?: string;
    barcode: string;
    price: number;
    stock: number;
    isVisible: boolean;
    categoryId: number;
  }): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/${id}`, product, {
      headers: this.authService.getAuthHeaders()
    });
  }

  toggleVisibility(id: number, isVisible: boolean): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/${id}/visibility`, { isVisible }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteProduct(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
