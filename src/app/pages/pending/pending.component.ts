import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, ConfirmDialogComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css',
})
export class PendingComponent implements OnInit {

  pendingDocs: any[] = [];
  isLoading = true;

  selectedDoc: any = null;
  editFields: any = {};
  showDrawer = false;

  showFilePreview = false;
  filePreviewUrl = '';

  showRejectConfirm = false;

  actionLoading = false;
  successMessage = '';
  errorMessage = '';

  private fieldLabels: any = {
    // Employee
    name: 'Nom (User to be activated)',
    company: 'Société (Company)',
    site: 'Site',
    department: 'Département',
    mobile: 'Mobile',
    officePhone: 'Téléphone bureau',
    kindOfUpdate: 'Type de demande',
    requester: 'Demandeur (Requester)',
    requesterJobRole: 'Job Role du demandeur',
    // Matériel
    societe: 'Société',
    direction: 'Direction',
    fonction: 'Fonction',
    prenom: 'Prénom',
    nom: 'Nom',
    matricule: 'Matricule',
    numeroTicket: 'N° de ticket',
    ordinateurDesktop: 'Ordinateur — Desktop',
    ordinateurLaptop: 'Ordinateur — Laptop',
    ordinateurIpad: 'Ordinateur — iPad',
    telephonePosteInterne: 'Téléphone — Poste interne',
    telephoneSmartphone: 'Téléphone — Smartphone',
    internetCleInternet: 'Internet — Clé Internet',
    internetPuceInternet: 'Internet — Puce Internet',
    // Matériel externe
    role: 'Rôle',
    societeUniversite: 'Société / Université',
    directionDepartement: 'Direction / Département',
    encadreurOpalia: 'Encadreur Opalia',
    tel: 'Téléphone',
    raisonAutorisation: 'Raison d\'autorisation',
    cleUsb: 'Clé USB',
    disqueDurExterne: 'Disque dur externe',
    cle4G: 'Clé 4G',
    lecteurDvd: 'Lecteur DVD',
    ordinateurPersonale: 'Ordinateur personnel',
    // Accès
    classification: 'Classification',
  };

  /** Champs à valeurs fixes — rendus en <select> dans le drawer. */
  private selectOptions: { [key: string]: string[] } = {
    kindOfUpdate:   ['Activation', 'Modification', 'Removal', 'Suspension', 'Reactivation'],
    role:           ['Employeur Opalia', 'Stagiaire', 'Consultant'],
    classification: ['Confidentiel', 'Non confidentiel'],
  };

  private employeeFields = [
    'name','company','site','department','mobile','officePhone',
    'kindOfUpdate','requester','requesterJobRole'
  ];
  private materialFields = [
    'societe','site','direction','fonction','prenom','nom','matricule',
    'numeroTicket','ordinateurDesktop','ordinateurLaptop','ordinateurIpad',
    'telephonePosteInterne','telephoneSmartphone',
    'internetCleInternet','internetPuceInternet'
  ];
  private externalMaterialFields = [
    'role','societeUniversite','site','directionDepartement','fonction',
    'encadreurOpalia','prenom','nom','matricule','tel',
    'numeroTicket','raisonAutorisation',
    'cleUsb','disqueDurExterne','cle4G','lecteurDvd','ordinateurPersonale'
  ];
  private accessRequestFields = [
    'societe','site','direction','fonction','prenom','nom','matricule','tel',
    'classification'
  ];
  private boolFields = new Set([
    'ordinateurDesktop','ordinateurLaptop','ordinateurIpad',
    'telephonePosteInterne','telephoneSmartphone',
    'internetCleInternet','internetPuceInternet',
    'cleUsb','disqueDurExterne','cle4G','lecteurDvd','ordinateurPersonale'
  ]);

  constructor(private apiService: ApiService) {}

  ngOnInit() { this.loadPending(); }

  loadPending() {
    this.isLoading = true;
    this.apiService.getPendingDocuments().subscribe({
      next: (data) => { this.pendingDocs = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Drawer d'édition ──────────────────────────────────────
  openDrawer(doc: any) {
    this.selectedDoc = doc;
    this.editFields = { ...(doc.extractedFields || {}) };
    // S'assure que toutes les clés attendues existent pour ce type
    this.fieldKeys().forEach(k => {
      if (this.editFields[k] === undefined) this.editFields[k] = '';
    });
    this.showDrawer = true;
  }

  closeDrawer() {
    this.showDrawer = false;
    this.selectedDoc = null;
    this.editFields = {};
  }

  fieldKeys(): string[] {
    if (this.selectedDoc?.documentType === 'EMPLOYEE') return this.employeeFields;
    if (this.selectedDoc?.documentType === 'TYPE_A')   return this.accessRequestFields;
    if (this.selectedDoc?.documentType === 'TYPE_B')   return this.materialFields;
    if (this.selectedDoc?.documentType === 'TYPE_C')   return this.externalMaterialFields;
    return Object.keys(this.editFields);
  }

  isSelectField(key: string): boolean {
    return !!this.selectOptions[key];
  }

  optionsFor(key: string): string[] {
    return this.selectOptions[key] || [];
  }

  fieldLabel(key: string): string {
    return this.fieldLabels[key] || key;
  }

  isBoolField(key: string): boolean {
    return this.boolFields.has(key);
  }

  isChecked(key: string): boolean {
    const v = this.editFields[key];
    return v === true || v === 'true';
  }

  setBool(key: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.editFields[key] = checked ? 'true' : 'false';
  }

  saveFields() {
    if (!this.selectedDoc) return;
    this.actionLoading = true;
    this.apiService.updatePendingFields(this.selectedDoc.id, this.editFields).subscribe({
      next: () => {
        this.actionLoading = false;
        this.selectedDoc.extractedFields = { ...this.editFields };
        const idx = this.pendingDocs.findIndex(d => d.id === this.selectedDoc.id);
        if (idx >= 0) this.pendingDocs[idx].extractedFields = { ...this.editFields };
        this.flash('Modifications enregistrées.');
      },
      error: () => {
        this.actionLoading = false;
        this.errorMessage = 'Erreur lors de l\'enregistrement.';
      }
    });
  }

  confirmFromDrawer() {
    if (!this.selectedDoc) return;
    this.actionLoading = true;
    // Enregistre les modifications puis archive le document
    this.apiService.updatePendingFields(this.selectedDoc.id, this.editFields).subscribe({
      next: () => this.doConfirm(this.selectedDoc.id),
      error: () => {
        this.actionLoading = false;
        this.errorMessage = 'Erreur lors de l\'enregistrement.';
      }
    });
  }

  private doConfirm(id: string) {
    this.apiService.confirmDocument(id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeDrawer();
        this.loadPending();
        this.flash('Document archivé avec succès !');
      },
      error: (err) => {
        this.actionLoading = false;
        this.errorMessage = err?.error?.error || 'Erreur lors de la confirmation.';
      }
    });
  }

  /** Ouvre le dialogue de confirmation de rejet. */
  rejectDoc() {
    if (!this.selectedDoc) return;
    this.showRejectConfirm = true;
  }

  cancelReject() {
    this.showRejectConfirm = false;
  }

  /** Confirme le rejet depuis le dialogue. */
  confirmReject() {
    if (!this.selectedDoc) return;
    this.showRejectConfirm = false;
    this.actionLoading = true;
    this.apiService.rejectDocument(this.selectedDoc.id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeDrawer();
        this.loadPending();
        this.flash('Document rejeté.');
      },
      error: () => {
        this.actionLoading = false;
        this.errorMessage = 'Erreur lors du rejet.';
      }
    });
  }

  // ── Aperçu du fichier scanné ──────────────────────────────
  openFile() {
    if (!this.selectedDoc) return;
    this.apiService.getPendingFile(this.selectedDoc.id).subscribe({
      next: (blob) => {
        this.filePreviewUrl = URL.createObjectURL(blob);
        this.showFilePreview = true;
      },
      error: () => { this.errorMessage = 'Fichier scanné introuvable.'; }
    });
  }

  closeFilePreview() {
    this.showFilePreview = false;
    this.filePreviewUrl = '';
  }

  private flash(msg: string) {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }

  // ── Helpers d'affichage ───────────────────────────────────
  getTopFields(fields: any): string[] {
    if (!fields) return [];
    return Object.keys(fields).filter(k => fields[k] && fields[k] !== 'None');
  }

  getDocTypeLabel(type: string): string {
    const m: any = {
      EMPLOYEE: 'Fiche Employé (E DSI 3812)',
      TYPE_A: 'Droits Accès (E DSI 3813)',
      TYPE_B: 'Matériels (E DSI 3328)',
      TYPE_C: 'Matériel Externe (E DSI 3797)',
    };
    return m[type] || type || 'Inconnu';
  }

  getDocTypeIcon(type: string): string {
    const m: any = { EMPLOYEE: '👤', TYPE_A: '🔐', TYPE_B: '💻', TYPE_C: '🔌' };
    return m[type] || '📄';
  }
}