import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStats, FarmerStats } from '../models/stats.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.api}/admin/stats`);
  }

  getFarmerStats(): Observable<FarmerStats> {
    return this.http.get<FarmerStats>(`${this.api}/farmer/dashboard`);
  }
}