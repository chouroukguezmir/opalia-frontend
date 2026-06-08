import { Directive, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';

export type RowStatus = 'pending' | 'confirmed';

/** Palette utilisée pour colorer les avatars (initiales). */
const AVATAR_COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];

/**
 * Classe de base des pages "liste" (Employés, Matériels, Matériel externe,
 * Demandes d'accès). Elle factorise tout le comportement commun :
 * chargement (documents confirmés + en attente), filtres, recherche,
 * édition, confirmation/rejet et ouverture du fichier joint.
 *
 * Chaque page concrète ne fournit que sa configuration : type de document,
 * champs de recherche/édition et endpoints de l'API.
 */
@Directive()
export abstract class PendingListPage implements OnInit {

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

  // ── Configuration fournie par chaque page concrète ──────────
  protected abstract documentType: string;       // EMPLOYEE | TYPE_A | TYPE_B | TYPE_C
  protected abstract searchFields: string[];
  protected abstract editableTextFields: string[];
  protected editableBoolFields: string[] = [];
  protected abstract fetchConfirmed(): Observable<any[]>;
  protected abstract fetchConfirmedFile(id: string): Observable<Blob>;

  /** Transformations supplémentaires d'une ligne en attente (ex: cases à cocher). */
  protected mapPendingExtra(_fields: any): any { return {}; }

  constructor(protected apiService: ApiService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      confirmed: this.fetchConfirmed(),
      pending:   this.apiService.getPendingDocuments(),
    }).subscribe({
      next: ({ confirmed, pending }) => {
        const confirmedRows = (confirmed || []).map((x: any) => ({
          ...x,
          _status: 'confirmed' as RowStatus,
        }));
        const pendingRows = (pending || [])
          .filter((p: any) => p.documentType === this.documentType)
          .map((p: any) => {
            const f = p.extractedFields || {};
            return {
              id: p.id,
              ...f,
              ...this.mapPendingExtra(f),
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
      return this.searchFields.some(field => x[field]?.toLowerCase().includes(q));
    });
  }

  countByStatus(s: 'all' | RowStatus): number {
    if (s === 'all') return this.items.length;
    return this.items.filter(i => i._status === s).length;
  }

  openDetail(row: any): void { this.selectedItem = row; this.saveFeedback = null; }
  closeDetail(): void { this.selectedItem = null; this.saveFeedback = null; }

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
      : this.fetchConfirmedFile(row.id);
    obs.subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => alert('Document joint introuvable')
    });
  }

  // ── Helpers d'affichage partagés ────────────────────────────
  toBool(v: any): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true';
    return false;
  }

  fullName(x: any): string {
    return [x?.prenom, x?.nom].filter(Boolean).join(' ') || '—';
  }

  protected initialsOf(name: string): string {
    if (!name || name === '—') return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  protected avatarColorOf(key: string): string {
    return AVATAR_COLORS[((key || '?').charCodeAt(0) || 0) % AVATAR_COLORS.length];
  }
}