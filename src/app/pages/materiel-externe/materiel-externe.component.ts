import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

type RowStatus = 'pending' | 'confirmed';

@Component({
  selector: 'app-materiel-externe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './materiel-externe.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class MaterielExterneComponent implements OnInit {

  items: any[] = [];
  filteredItems: any[] = [];
  isLoading = true;
  searchQuery = '';
  statusFilter: 'all' | RowStatus = 'all';
  selectedItem: any = null;
  actionBusyId: string | null = null;
  saveBusy = false;
  saveFeedback: { type: 'ok' | 'error'; text: string } | null = null;

  roleOptions = ['Employeur Opalia', 'Stagiaire', 'Consultant'];

  private editableTextFields = [
    'role', 'societeUniversite', 'site', 'directionDepartement', 'fonction',
    'encadreurOpalia', 'prenom', 'nom', 'matricule', 'tel',
    'numeroTicket', 'raisonAutorisation'
  ];
  private editableBoolFields = [
    'cleUsb', 'disqueDurExterne', 'cle4G', 'lecteurDvd', 'ordinateurPersonale'
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.loadAll(); }

  private toBool(v: any): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true';
    return false;
  }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      confirmed: this.apiService.getAllExternalMaterials(),
      pending:   this.apiService.getPendingDocuments(),
    }).subscribe({
      next: ({ confirmed, pending }) => {
        const confirmedRows = (confirmed || []).map((x: any) => ({
          ...x,
          _status: 'confirmed' as RowStatus,
        }));
        const pendingRows = (pending || [])
          .filter((p: any) => p.documentType === 'TYPE_C')
          .map((p: any) => {
            const f = p.extractedFields || {};
            return {
              id: p.id,
              ...f,
              cleUsb:              this.toBool(f.cleUsb),
              disqueDurExterne:    this.toBool(f.disqueDurExterne),
              cle4G:               this.toBool(f.cle4G),
              lecteurDvd:          this.toBool(f.lecteurDvd),
              ordinateurPersonale: this.toBool(f.ordinateurPersonale),
              attachedFile: p.originalFilePath,
              createdAt: p.scannedAt,
              _status: 'pending' as RowStatus,
              _pendingId: p.id,
            };
          });
        this.items = [...pendingRows, ...confirmedRows];
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setStatusFilter(s: 'all' | RowStatus): void {
    this.statusFilter = s;
    this.applyFilters();
  }

  onSearch(): void { this.applyFilters(); }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredItems = this.items.filter(x => {
      if (this.statusFilter !== 'all' && x._status !== this.statusFilter) return false;
      if (!q) return true;
      return (
        x.prenom?.toLowerCase().includes(q) ||
        x.nom?.toLowerCase().includes(q) ||
        x.matricule?.toLowerCase().includes(q) ||
        x.societeUniversite?.toLowerCase().includes(q) ||
        x.role?.toLowerCase().includes(q) ||
        x.numeroTicket?.toLowerCase().includes(q)
      );
    });
  }

  countByStatus(s: 'all' | RowStatus): number {
    if (s === 'all') return this.items.length;
    return this.items.filter(i => i._status === s).length;
  }

  openDetail(row: any): void {
    this.selectedItem = row;
    this.saveFeedback = null;
  }
  closeDetail(): void {
    this.selectedItem = null;
    this.saveFeedback = null;
  }

  saveEdits(): void {
    if (!this.selectedItem?._pendingId) return;
    const payload: { [k: string]: string } = {};
    for (const f of this.editableTextFields) {
      const v = this.selectedItem[f];
      payload[f] = v == null ? '' : String(v);
    }
    for (const f of this.editableBoolFields) {
      payload[f] = this.toBool(this.selectedItem[f]) ? 'true' : 'false';
    }
    this.saveBusy = true;
    this.saveFeedback = null;
    this.apiService.updatePendingFields(this.selectedItem._pendingId, payload).subscribe({
      next: () => {
        this.saveBusy = false;
        this.saveFeedback = { type: 'ok', text: '✓ Modifications enregistrées' };
        const idx = this.items.findIndex(i => i._pendingId === this.selectedItem._pendingId);
        if (idx >= 0) this.items[idx] = { ...this.selectedItem };
        this.applyFilters();
      },
      error: () => {
        this.saveBusy = false;
        this.saveFeedback = { type: 'error', text: '✕ Erreur lors de l\'enregistrement' };
      }
    });
  }

  confirmRow(row: any, e?: Event): void {
    e?.stopPropagation();
    if (!row._pendingId) return;
    this.actionBusyId = row._pendingId;
    this.apiService.confirmDocument(row._pendingId).subscribe({
      next: () => { this.actionBusyId = null; this.loadAll(); },
      error: () => { this.actionBusyId = null; alert('Erreur lors de la confirmation'); }
    });
  }

  rejectRow(row: any, e?: Event): void {
    e?.stopPropagation();
    if (!row._pendingId) return;
    if (!confirm('Rejeter ce document ?')) return;
    this.actionBusyId = row._pendingId;
    this.apiService.rejectDocument(row._pendingId).subscribe({
      next: () => { this.actionBusyId = null; this.loadAll(); },
      error: () => { this.actionBusyId = null; alert('Erreur lors du rejet'); }
    });
  }

  openAttachedFile(row: any, e?: Event): void {
    e?.stopPropagation();
    const obs = row._status === 'pending'
      ? this.apiService.getPendingFile(row._pendingId)
      : this.apiService.getExternalMaterialFile(row.id);
    obs.subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => alert('Document joint introuvable')
    });
  }

  fullName(x: any): string {
    return [x?.prenom, x?.nom].filter(Boolean).join(' ') || '—';
  }

  getInitials(x: any): string {
    const name = this.fullName(x);
    if (!name || name === '—') return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(x: any): string {
    const colors = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];
    const key = (x?.prenom || x?.nom || '?');
    return colors[(key.charCodeAt(0) || 0) % colors.length];
  }

  selectedItems(x: any): string[] {
    if (!x) return [];
    const out: string[] = [];
    if (x.cleUsb)               out.push('Clé USB');
    if (x.disqueDurExterne)     out.push('Disque dur externe');
    if (x.cle4G)                out.push('Clé 4G');
    if (x.lecteurDvd)           out.push('Lecteur DVD');
    if (x.ordinateurPersonale)  out.push('Ordinateur personnel');
    return out;
  }

  yesNo(v: any): string { return this.toBool(v) ? '✅ Oui' : '— Non'; }
}