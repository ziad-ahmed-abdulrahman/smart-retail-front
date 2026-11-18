import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse, Store } from '../models/app.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly baseUrl = `${API_BASE_URL}/api/stores`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getMyStores(): Observable<ApiResponse<Store[]>> {
    return this.http.get<ApiResponse<Store[]>>(this.baseUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStoreById(id: number): Observable<ApiResponse<Store>> {
    return this.http.get<ApiResponse<Store>>(`${this.baseUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createStore(data: { name: string; address?: string; city?: string }): Observable<ApiResponse<Store>> {
    return this.http.post<ApiResponse<Store>>(this.baseUrl, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateStore(id: number, data: { name: string; address?: string; city?: string; isActive: boolean }): Observable<ApiResponse<Store>> {
    return this.http.put<ApiResponse<Store>>(`${this.baseUrl}/${id}`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteStore(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
