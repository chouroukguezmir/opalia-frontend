import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

type RowStatus = 'pending' | 'confirmed';

@Component({
  selector: 'app-access',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, ConfirmDialogComponent],
  templateUrl: './access.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class AccessComponent implements OnInit {

  items: any[] = [];
  filteredItems: any[] = [];
  isLoading = true;
  searchQuery = '';
  statusFilter: 'all' | RowStatus = 'all';
  selectedItem: any = null;
  actionBusyId: string | null = null;

  showRejectConfirm = false;
  private rejectTarget: any = null;
  saveBusy = false;
  saveFeedback: { type: 'ok' | 'error'; text: string } | null = null;

  classificationOptions = ['Confidentiel', 'Non confidentiel'];

  private editableTextFields = [
    'societe', 'site', 'direction', 'fonction', 'prenom', 'nom',
    'matricule', 'tel', 'classification'
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      confirmed: this.apiService.getAllAccessRequests(),
      pending:   this.apiService.getPendingDocuments(),
    }).subscribe({
      next: ({ confirmed, pending }) => {
        const confirmedRows = (confirmed || []).map((x: any) => ({
          ...x,
          _status: 'confirmed' as RowStatus,
        }));
        const pendingRows = (pending || [])
          .filter((p: any) => p.documentType === 'TYPE_A')
          .map((p: any) => ({
            id: p.id,
            ...(p.extractedFields || {}),
            attachedFile: p.originalFilePath,
            createdAt: p.scannedAt,
            _status: 'pending' as RowStatus,
            _pendingId: p.id,
          }));
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
        x.societe?.toLowerCase().includes(q) ||
        x.direction?.toLowerCase().includes(q) ||
        x.classification?.toLowerCase().includes(q)
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

  /** Ouvre le dialogue de confirmation de rejet pour la ligne donnée. */
  rejectRow(row: any, e?: Event): void {
    e?.stopPropagation();
    if (!row._pendingId) return;
    this.rejectTarget = row;
    this.showRejectConfirm = true;
  }

  cancelReject(): void {
    this.showRejectConfirm = false;
    this.rejectTarget = null;
  }

  /** Confirme le rejet depuis le dialogue. */
  confirmReject(): void {
    const row = this.rejectTarget;
    this.showRejectConfirm = false;
    this.rejectTarget = null;
    if (!row?._pendingId) return;
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
      : this.apiService.getAccessRequestFile(row.id);
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

  classifBadge(c: string): string {
    if (c === 'Confidentiel') return '🔒';
    if (c === 'Non confidentiel') return '🔓';
    return '—';
  }
}