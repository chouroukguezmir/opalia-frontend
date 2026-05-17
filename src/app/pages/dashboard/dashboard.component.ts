import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  stats: any = {
  scannedTotal: 0,
  analyzedTotal: 0,
  handwritten: 0,
  pdfsGenerated: 0,
  scannedEmployee: 0,
  scannedAdministrative: 0,
  scannedUnknown: 0,
  bySubType: { TYPE_A: 0, TYPE_B: 0, TYPE_C: 0 }
};

  recentSessions: any[] = [];
  isLoading = true;
  today = new Date();

  constructor(private ApiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.ApiService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getSuccessRate(): number {
    if (this.stats.scannedTotal === 0) return 0;
    return Math.round((this.stats.analyzedTotal / this.stats.scannedTotal) * 100);
  }
}