import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'scan',
    loadComponent: () =>
      import('./pages/scan/scan.component').then(m => m.ScanComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pending',
    loadComponent: () =>
      import('./pages/pending/pending.component').then(m => m.PendingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./pages/documents/documents.component').then(m => m.DocumentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./pages/employees/employees.component').then(m => m.EmployeesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'materiels',
    loadComponent: () =>
      import('./pages/materiels/materiels.component').then(m => m.MaterielsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'materiel-externe',
    loadComponent: () =>
      import('./pages/materiel-externe/materiel-externe.component').then(m => m.MaterielExterneComponent),
    canActivate: [authGuard]
  },
  {
    path: 'access',
    loadComponent: () =>
      import('./pages/access/access.component').then(m => m.AccessComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'login' }
];