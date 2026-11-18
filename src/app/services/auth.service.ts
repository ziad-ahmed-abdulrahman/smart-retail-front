import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL, ApiResponse, UserProfile } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${API_BASE_URL}/api/accounts`;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<ApiResponse<{ token: string; refreshToken: string }>> {
    return this.http.post<ApiResponse<{ token: string; refreshToken: string }>>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.isSuccess && res.data) {
          this.saveTokens(res.data.token, res.data.refreshToken);
        }
      })
    );
  }

  register(data: { email: string; password: string; fullName?: string; storeName?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/register`, data);
  }

  sendActivation(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/account-activations`, { email });
  }

  verifyActivation(email: string, code: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/account-activations/verify`, { email, code });
  }

  sendResetCode(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/account-resets`, { email });
  }

  verifyResetCode(data: { email: string; code: string; newPassword: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/account-resets/verify`, data);
  }

  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.baseUrl}/me`, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/me`, data, {
      headers: this.getAuthHeaders()
    });
  }

  sendChangePasswordCode(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/account-passwordchanges`, { email });
  }

  verifyChangePasswordCode(data: { email: string; code: string; oldPassword: string; newPassword: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/account-passwordchanges/verify`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/change-password`, data, {
      headers: this.getAuthHeaders()
    });
  }

  saveTokens(token: string, refreshToken: string) {
    localStorage.setItem('sr_owner_token', token);
    localStorage.setItem('sr_owner_refresh', refreshToken);
  }

  getToken(): string | null {
    return localStorage.getItem('sr_owner_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('sr_owner_refresh');
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`
    });
  }

  logout() {
    localStorage.removeItem('sr_owner_token');
    localStorage.removeItem('sr_owner_refresh');
  }
}
