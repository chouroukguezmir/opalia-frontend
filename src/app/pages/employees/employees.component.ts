import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

type RowStatus = 'pending' | 'confirmed';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit {

  items: any[] = [];
  filteredItems: any[] = [];
  isLoading = true;
  searchQuery = '';
  statusFilter: 'all' | RowStatus = 'all';
  selectedItem: any = null;
  actionBusyId: string | null = null;
  saveBusy = false;
  saveFeedback: { type: 'ok' | 'error'; text: string } | null = null;

  kindOfUpdateOptions = ['Activation', 'Modification', 'Removal', 'Suspension', 'Reactivation'];

  private editableFields = [
    'name', 'company', 'site', 'department', 'mobile', 'officePhone',
    'kindOfUpdate', 'requester', 'requesterJobRole'
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      confirmed: this.apiService.getAllEmployees(),
      pending:   this.apiService.getPendingDocuments(),
    }).subscribe({
      next: ({ confirmed, pending }) => {
        const confirmedRows = (confirmed || []).map((e: any) => ({
          ...e,
          _status: 'confirmed' as RowStatus,
        }));
        const pendingRows = (pending || [])
          .filter((p: any) => p.documentType === 'EMPLOYEE')
          .map((p: any) => ({
            id: p.id,
            ...(p.extractedFields || {}),
            attachedFile: p.originalFilePath,
            createdAt: p.scannedAt,
            sourceDocumentId: p.id,
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
    this.filteredItems = this.items.filter(e => {
      if (this.statusFilter !== 'all' && e._status !== this.statusFilter) return false;
      if (!q) return true;
      return (
        e.name?.toLowerCase().includes(q) ||
        e.company?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.site?.toLowerCase().includes(q)
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
    for (const f of this.editableFields) {
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
      : this.apiService.getEmployeeFile(row.id);
    obs.subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => alert('Document joint introuvable')
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const colors = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }
}