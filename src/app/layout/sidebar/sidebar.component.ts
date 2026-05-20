import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

menuItems = [
  { icon: '📊', label: 'Dashboard',          route: '/dashboard' },
  { icon: '📤', label: 'Scanner',            route: '/scan'      },
  { icon: '⏳', label: 'En attente',         route: '/pending'   },
  { icon: '📁', label: 'Documents',          route: '/documents' },
  { icon: '👥', label: 'Employés',           route: '/employees' },
  { icon: '💻', label: 'Matériels',          route: '/materiels' },
  { icon: '🔌', label: 'Matériel externe',   route: '/materiel-externe' },
  { icon: '🔐', label: 'Accès',              route: '/access' },
];
  constructor(private authService: AuthService, private router: Router) {}

  getUsername(): string {
    return this.authService.getUsername();
  }

  onLogout(): void {
    this.authService.logout();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}