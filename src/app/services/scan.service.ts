import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScanSession } from '../models/scan.model';

@Injectable({
  providedIn: 'root'
})
export class ScanService {

  private apiUrl = 'http://localhost:8081/api/scan';

  constructor(private http: HttpClient) {}

  uploadDocument(file: File): Observable<ScanSession> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ScanSession>(`${this.apiUrl}/upload`, formData);
  }

  getSession(id: string): Observable<ScanSession> {
    return this.http.get<ScanSession>(`${this.apiUrl}/${id}`);
  }
}