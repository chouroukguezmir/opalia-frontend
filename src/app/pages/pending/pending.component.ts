import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css',
})
export class PendingComponent implements OnInit {

  pendingDocs: any[]      = [];
  isLoading               = true;
  selectedDoc: any        = null;
  showPdfPreview          = false;
  pdfPreviewUrl           = '';
  actionLoading           = false;
  successMessage          = '';
  errorMessage            = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() { this.loadPending(); }

  loadPending() {
    this.isLoading = true;
    this.apiService.getPendingDocuments().subscribe({
      next: (data) => {
        this.pendingDocs = data;
        this.isLoading   = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  openPreview(doc: any) {
    this.selectedDoc   = doc;
    this.pdfPreviewUrl = this.apiService.getPdfPreviewUrl(doc.id);
    this.showPdfPreview = true;
  }

  closePreview() {
    this.showPdfPreview = false;
    this.selectedDoc    = null;
    this.pdfPreviewUrl  = '';
  }

  confirmDoc(doc: any) {
    this.actionLoading = true;
    this.apiService.confirmDocument(doc.id).subscribe({
      next: () => {
        this.actionLoading  = false;
        this.successMessage = 'Document archivé avec succès !';
        this.closePreview();
        this.loadPending();
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: () => {
        this.actionLoading = false;
        this.errorMessage  = 'Erreur lors de la confirmation.';
      }
    });
  }

  rejectDoc(doc: any) {
    if (!confirm('Êtes-vous sûr de vouloir rejeter ce document ?')) return;
    this.actionLoading = true;
    this.apiService.rejectDocument(doc.id).subscribe({
      next: () => {
        this.actionLoading  = false;
        this.successMessage = 'Document rejeté.';
        this.closePreview();
        this.loadPending();
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: () => {
        this.actionLoading = false;
        this.errorMessage  = 'Erreur lors du rejet.';
      }
    });
  }

  getDocTypeLabel(type: string): string {
    const m: any = {
      EMPLOYEE: 'Fiche Employé (E DSI 3812)',
      TYPE_A:   'Droits Accès (E DSI 3813)',
      TYPE_B:   'Matériels (E DSI 3328)',
      TYPE_C:   'Matériel Externe (E DSI 3797)',
    };
    return m[type] || type || 'Inconnu';
  }

  getDocTypeIcon(type: string): string {
    const m: any = { EMPLOYEE:'👤', TYPE_A:'🔐', TYPE_B:'💻', TYPE_C:'🔌' };
    return m[type] || '📄';
  }

  getHwLabel(quality: string): string {
    const m: any = { GOOD:'Bien lisible', MEDIUM:'Partiellement lisible', POOR:'Difficile à lire' };
    return m[quality] || quality;
  }

  getHwClass(quality: string): string {
    const m: any = { GOOD:'hw-good', MEDIUM:'hw-medium', POOR:'hw-poor' };
    return m[quality] || '';
  }
  getTopFields(fields: any): string[] {
    if (!fields) return [];
    return Object.keys(fields).filter(k => fields[k] && fields[k] !== 'None');
    }
}