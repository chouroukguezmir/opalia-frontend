import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

type RowStatus = 'pending' | 'confirmed';

@Component({
  selector: 'app-materiels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './materiels.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class MaterielsComponent implements OnInit {

  items: any[] = [];
  filteredItems: any[] = [];
  isLoading = true;
  searchQuery = '';
  statusFilter: 'all' | RowStatus = 'all';
  selectedItem: any = null;
  actionBusyId: string | null = null;
  saveBusy = false;
  saveFeedback: { type: 'ok' | 'error'; text: string } | null = null;

  private editableTextFields = [
    'societe', 'site', 'direction', 'fonction', 'prenom', 'nom',
    'matricule', 'numeroTicket'
  ];
  private editableBoolFields = [
    'ordinateurDesktop', 'ordinateurLaptop', 'ordinateurIpad',
    'telephonePosteInterne', 'telephoneSmartphone',
    'internetCleInternet', 'internetPuceInternet'
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
      confirmed: this.apiService.getAllMaterials(),
      pending:   this.apiService.getPendingDocuments(),
    }).subscribe({
      next: ({ confirmed, pending }) => {
        const confirmedRows = (confirmed || []).map((m: any) => ({
          ...m,
          _status: 'confirmed' as RowStatus,
        }));
        const pendingRows = (pending || [])
          .filter((p: any) => p.documentType === 'TYPE_B')
          .map((p: any) => {
            const f = p.extractedFields || {};
            return {
              id: p.id,
              ...f,
              ordinateurDesktop:     this.toBool(f.ordinateurDesktop),
              ordinateurLaptop:      this.toBool(f.ordinateurLaptop),
              ordinateurIpad:        this.toBool(f.ordinateurIpad),
              telephonePosteInterne: this.toBool(f.telephonePosteInterne),
              telephoneSmartphone:   this.toBool(f.telephoneSmartphone),
              internetCleInternet:   this.toBool(f.internetCleInternet),
              internetPuceInternet:  this.toBool(f.internetPuceInternet),
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
    this.filteredItems = this.items.filter(m => {
      if (this.statusFilter !== 'all' && m._status !== this.statusFilter) return false;
      if (!q) return true;
      return (
        m.prenom?.toLowerCase().includes(q) ||
        m.nom?.toLowerCase().includes(q) ||
        m.matricule?.toLowerCase().includes(q) ||
        m.societe?.toLowerCase().includes(q) ||
        m.direction?.toLowerCase().includes(q) ||
        m.numeroTicket?.toLowerCase().includes(q)
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
      : this.apiService.getMaterialFile(row.id);
    obs.subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => alert('Document joint introuvable')
    });
  }

  fullName(m: any): string {
    return [m?.prenom, m?.nom].filter(Boolean).join(' ') || '—';
  }

  getInitials(m: any): string {
    const name = this.fullName(m);
    if (!name || name === '—') return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(m: any): string {
    const colors = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];
    const key = (m?.prenom || m?.nom || '?');
    const index = (key.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }

  selectedItems(m: any): string[] {
    if (!m) return [];
    const items: string[] = [];
    if (m.ordinateurDesktop)        items.push('Desktop');
    if (m.ordinateurLaptop)         items.push('Laptop');
    if (m.ordinateurIpad)           items.push('iPad');
    if (m.telephonePosteInterne)    items.push('Poste interne');
    if (m.telephoneSmartphone)      items.push('Smartphone');
    if (m.internetCleInternet)      items.push('Clé Internet');
    if (m.internetPuceInternet)     items.push('Puce Internet');
    return items;
  }

  yesNo(v: any): string { return this.toBool(v) ? '✅ Oui' : '— Non'; }
}