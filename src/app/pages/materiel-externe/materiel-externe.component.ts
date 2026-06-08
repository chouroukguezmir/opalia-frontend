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
  selector: 'app-materiel-externe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, ConfirmDialogComponent],
  templateUrl: './materiel-externe.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class MaterielExterneComponent extends PendingListPage {

  roleOptions = ['Employeur Opalia', 'Stagiaire', 'Consultant'];

  protected documentType = 'TYPE_C';
  protected searchFields = ['prenom', 'nom', 'matricule', 'societeUniversite', 'role', 'numeroTicket'];
  protected editableTextFields = [
    'role', 'societeUniversite', 'site', 'directionDepartement', 'fonction',
    'encadreurOpalia', 'prenom', 'nom', 'matricule', 'tel',
    'numeroTicket', 'raisonAutorisation'
  ];
  protected override editableBoolFields = [
    'cleUsb', 'disqueDurExterne', 'cle4G', 'lecteurDvd', 'ordinateurPersonale'
  ];

  constructor(api: ApiService) { super(api); }

  protected fetchConfirmed(): Observable<any[]> { return this.apiService.getAllExternalMaterials(); }
  protected fetchConfirmedFile(id: string): Observable<Blob> { return this.apiService.getExternalMaterialFile(id); }

  protected override mapPendingExtra(f: any): any {
    return {
      cleUsb:              this.toBool(f.cleUsb),
      disqueDurExterne:    this.toBool(f.disqueDurExterne),
      cle4G:               this.toBool(f.cle4G),
      lecteurDvd:          this.toBool(f.lecteurDvd),
      ordinateurPersonale: this.toBool(f.ordinateurPersonale),
    };
  }

  getInitials(x: any): string { return this.initialsOf(this.fullName(x)); }
  getAvatarColor(x: any): string { return this.avatarColorOf(x?.prenom || x?.nom || '?'); }

  selectedItems(x: any): string[] {
    if (!x) return [];
    const out: string[] = [];
    if (x.cleUsb)              out.push('Clé USB');
    if (x.disqueDurExterne)    out.push('Disque dur externe');
    if (x.cle4G)               out.push('Clé 4G');
    if (x.lecteurDvd)          out.push('Lecteur DVD');
    if (x.ordinateurPersonale) out.push('Ordinateur personnel');
    return out;
  }

  yesNo(v: any): string { return this.toBool(v) ? '✅ Oui' : '— Non'; }
}