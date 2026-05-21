import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

interface TypeBucket { pending: number; confirmed: number; total: number; }

interface DashboardStats {
  totals: { all: number; pending: number; confirmed: number };
  byType: {
    employees: TypeBucket;
    materials: TypeBucket;
    externalMaterials: TypeBucket;
    accessRequests: TypeBucket;
  };
  todayScanned: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  private readonly emptyBucket: TypeBucket = { pending: 0, confirmed: 0, total: 0 };
  stats: DashboardStats = {
    totals: { all: 0, pending: 0, confirmed: 0 },
    byType: {
      employees:         { ...this.emptyBucket },
      materials:         { ...this.emptyBucket },
      externalMaterials: { ...this.emptyBucket },
      accessRequests:    { ...this.emptyBucket },
    },
    todayScanned: 0,
  };

  isLoading = true;
  today = new Date();

  entityCards = [
    { key: 'employees',         label: 'Employés',         icon: '👥', route: '/employees',        accent: '#0d9488' },
    { key: 'materials',         label: 'Matériels',        icon: '💻', route: '/materiels',        accent: '#6366f1' },
    { key: 'externalMaterials', label: 'Matériel externe', icon: '🔌', route: '/materiel-externe', accent: '#f59e0b' },
    { key: 'accessRequests',    label: 'Accès',            icon: '🔐', route: '/access',           accent: '#ec4899' },
  ] as const;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.apiService.getDashboardStats().subscribe({
      next: (data: DashboardStats) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  bucket(key: 'employees' | 'materials' | 'externalMaterials' | 'accessRequests'): TypeBucket {
    return this.stats.byType[key] || this.emptyBucket;
  }

  confirmedRate(): number {
    if (!this.stats.totals.all) return 0;
    return Math.round((this.stats.totals.confirmed / this.stats.totals.all) * 100);
  }
}