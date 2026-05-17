import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private getFileHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ── Auth ──────────────────────────────────────────────────
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { username, password });
  }

  // ── Dashboard ─────────────────────────────────────────────
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/stats`,
      { headers: this.getHeaders() });
  }

  // ── Scan ──────────────────────────────────────────────────
  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/scan/upload`,
      formData, { headers: this.getFileHeaders() });
  }

  // ── Documents en attente (pending) ────────────────────────
  getPendingDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pending`,
      { headers: this.getHeaders() });
  }

  confirmDocument(pendingId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/pending/${pendingId}/confirm`,
      {}, { headers: this.getHeaders() });
  }

  rejectDocument(pendingId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/pending/${pendingId}/reject`,
      {}, { headers: this.getHeaders() });
  }

  getPdfPreviewUrl(pendingId: string): string {
    const token = localStorage.getItem('token');
    return `${this.baseUrl}/pending/${pendingId}/pdf`;
  }

  // ── Documents archivés ────────────────────────────────────
  getAllDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin-documents`,
      { headers: this.getHeaders() });
  }

  // ── Employés ──────────────────────────────────────────────
  getAllEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees`,
      { headers: this.getHeaders() });
  }
}