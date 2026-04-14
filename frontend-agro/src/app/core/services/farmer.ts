import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FarmerProfile {
  farm_name?: string;
  city?: string;
  bio?: string;
  phone?: string;
}

export interface FarmerProfileResponse {
  profile: FarmerProfile | null;
}

@Injectable({ providedIn: 'root' })
export class FarmerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<FarmerProfileResponse> {
    return this.http.get<FarmerProfileResponse>(`${this.apiUrl}/farmer/profile`);
  }

  updateProfile(profile: FarmerProfile): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/farmer/profile`, profile);
  }
}