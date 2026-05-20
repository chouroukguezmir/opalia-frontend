import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
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

  actionLoading = false;
  successMessage = '';
  errorMessage = '';

  private fieldLabels: any = {
    name: 'Nom (User to be activated)',
    company: 'Société',
    site: 'Site',
    department: 'Département',
    mobile: 'Mobile',
    officePhone: 'Téléphone bureau',
    kindOfUpdate: 'Type de demande',
    requester: 'Demandeur (Requester)',
    requesterJobRole: 'Job Role du demandeur',
  };

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
    this.showDrawer = true;
  }

  closeDrawer() {
    this.showDrawer = false;
    this.selectedDoc = null;
    this.editFields = {};
  }

  fieldKeys(): string[] {
    return Object.keys(this.editFields);
  }

  fieldLabel(key: string): string {
    return this.fieldLabels[key] || key;
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

  rejectDoc() {
    if (!this.selectedDoc) return;
    if (!confirm('Êtes-vous sûr de vouloir rejeter ce document ?')) return;
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

  getHwLabel(quality: string): string {
    const m: any = { GOOD: 'Bien lisible', MEDIUM: 'Partiellement lisible', POOR: 'Difficile à lire' };
    return m[quality] || quality;
  }

  getHwClass(quality: string): string {
    const m: any = { GOOD: 'hw-good', MEDIUM: 'hw-medium', POOR: 'hw-poor' };
    return m[quality] || '';
  }
}