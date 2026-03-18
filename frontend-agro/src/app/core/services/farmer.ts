import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FarmerProfile {
  farm_name?: string;
  city?: string;
  bio?: string;
  is_verified?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FarmerService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<{ profile: FarmerProfile }> {
    return this.http.get<{ profile: FarmerProfile }>(`${this.apiUrl}/farmer/profile`);
  }

  updateProfile(profile: FarmerProfile): Observable<any> {
    return this.http.put(`${this.apiUrl}/farmer/profile`, profile);
  }
}
