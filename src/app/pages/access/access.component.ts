import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { PendingListPage } from '../shared/pending-list.page';

@Component({
  selector: 'app-access',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, ConfirmDialogComponent],
  templateUrl: './access.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class AccessComponent extends PendingListPage {

  classificationOptions = ['Confidentiel', 'Non confidentiel'];

  protected documentType = 'TYPE_A';
  protected searchFields = ['prenom', 'nom', 'matricule', 'societe', 'direction', 'classification'];
  protected editableTextFields = [
    'societe', 'site', 'direction', 'fonction', 'prenom', 'nom',
    'matricule', 'tel', 'classification'
  ];

  constructor(api: ApiService) { super(api); }

  protected fetchConfirmed(): Observable<any[]> { return this.apiService.getAllAccessRequests(); }
  protected fetchConfirmedFile(id: string): Observable<Blob> { return this.apiService.getAccessRequestFile(id); }

  getInitials(x: any): string { return this.initialsOf(this.fullName(x)); }
  getAvatarColor(x: any): string { return this.avatarColorOf(x?.prenom || x?.nom || '?'); }

  classifBadge(c: string): string {
    if (c === 'Confidentiel') return '🔒';
    if (c === 'Non confidentiel') return '🔓';
    return '—';
  }
}