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
  selector: 'app-materiels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, ConfirmDialogComponent],
  templateUrl: './materiels.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class MaterielsComponent extends PendingListPage {

  protected documentType = 'TYPE_B';
  protected searchFields = ['prenom', 'nom', 'matricule', 'societe', 'direction', 'numeroTicket'];
  protected editableTextFields = [
    'societe', 'site', 'direction', 'fonction', 'prenom', 'nom',
    'matricule', 'numeroTicket'
  ];
  protected override editableBoolFields = [
    'ordinateurDesktop', 'ordinateurLaptop', 'ordinateurIpad',
    'telephonePosteInterne', 'telephoneSmartphone',
    'internetCleInternet', 'internetPuceInternet'
  ];

  constructor(api: ApiService) { super(api); }

  protected fetchConfirmed(): Observable<any[]> { return this.apiService.getAllMaterials(); }
  protected fetchConfirmedFile(id: string): Observable<Blob> { return this.apiService.getMaterialFile(id); }

  protected override mapPendingExtra(f: any): any {
    return {
      ordinateurDesktop:     this.toBool(f.ordinateurDesktop),
      ordinateurLaptop:      this.toBool(f.ordinateurLaptop),
      ordinateurIpad:        this.toBool(f.ordinateurIpad),
      telephonePosteInterne: this.toBool(f.telephonePosteInterne),
      telephoneSmartphone:   this.toBool(f.telephoneSmartphone),
      internetCleInternet:   this.toBool(f.internetCleInternet),
      internetPuceInternet:  this.toBool(f.internetPuceInternet),
    };
  }

  getInitials(m: any): string { return this.initialsOf(this.fullName(m)); }
  getAvatarColor(m: any): string { return this.avatarColorOf(m?.prenom || m?.nom || '?'); }

  selectedItems(m: any): string[] {
    if (!m) return [];
    const items: string[] = [];
    if (m.ordinateurDesktop)     items.push('Desktop');
    if (m.ordinateurLaptop)      items.push('Laptop');
    if (m.ordinateurIpad)        items.push('iPad');
    if (m.telephonePosteInterne) items.push('Poste interne');
    if (m.telephoneSmartphone)   items.push('Smartphone');
    if (m.internetCleInternet)   items.push('Clé Internet');
    if (m.internetPuceInternet)  items.push('Puce Internet');
    return items;
  }

  yesNo(v: any): string { return this.toBool(v) ? '✅ Oui' : '— Non'; }
}