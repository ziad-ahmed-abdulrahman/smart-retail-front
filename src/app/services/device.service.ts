import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse } from '../models/app.models';
import { AuthService } from './auth.service';

export interface Device {
  id: number;
  deviceCode: string;
  name: string;
  type: string; // 'SmartCamera' | 'PosTerminal'
  isOnline: boolean;
  lastPing?: string;
  storeId: number;
  storeName?: string;
  createdAt: string;
}

export interface CreateDevicePayload {
  deviceCode: string;
  name: string;
  type: string;
  storeId: number;
}

export interface UpdateDevicePayload {
  name: string;
  type: string;
  isOnline?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly baseUrl = `${API_BASE_URL}/api/devices`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getStoreDevices(storeId: number): Observable<ApiResponse<Device[]>> {
    return this.http.get<ApiResponse<Device[]>>(`${this.baseUrl}/store/${storeId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getDeviceById(id: number): Observable<ApiResponse<Device>> {
    return this.http.get<ApiResponse<Device>>(`${this.baseUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createDevice(payload: CreateDevicePayload): Observable<ApiResponse<Device>> {
    return this.http.post<ApiResponse<Device>>(this.baseUrl, payload, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateDevice(id: number, payload: UpdateDevicePayload): Observable<ApiResponse<Device>> {
    return this.http.put<ApiResponse<Device>>(`${this.baseUrl}/${id}`, payload, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteDevice(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateStatus(id: number, isOnline: boolean): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/${id}/status`, { isOnline }, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
