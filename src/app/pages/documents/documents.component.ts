import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit {

  documents: any[] = [];
  filteredDocuments: any[] = [];
  isLoading = true;
  searchQuery = '';
  selectedType = '';
  selectedDoc: any = null;

  types = [
    { value: '', label: 'Tous les types' },
    { value: 'TYPE_A', label: 'Droits Accès (E DSI 3813)' },
    { value: 'TYPE_B', label: 'Matériels (E DSI 3328)' },
    { value: 'TYPE_C', label: 'Matériel Externe (E DSI 3797)' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.apiService.getAllDocuments().subscribe({
      next: (data: any[]) => {
        this.documents = data;
        this.filteredDocuments = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.documents];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(d =>
        d.nom?.toLowerCase().includes(q) ||
        d.prenom?.toLowerCase().includes(q) ||
        d.matricule?.toLowerCase().includes(q) ||
        d.societe?.toLowerCase().includes(q)
      );
    }

    if (this.selectedType) {
      result = result.filter(d => d.subType === this.selectedType);
    }

    this.filteredDocuments = result;
  }

  openDetail(doc: any): void {
    this.selectedDoc = doc;
  }

  closeDetail(): void {
    this.selectedDoc = null;
  }

  getTypeBadgeClass(type: string): string {
    const map: any = {
      'TYPE_A': 'badge-a',
      'TYPE_B': 'badge-b',
      'TYPE_C': 'badge-c'
    };
    return map[type] || 'badge-default';
  }

  getTypeLabel(type: string): string {
    const map: any = {
      'TYPE_A': 'Droits Accès',
      'TYPE_B': 'Matériels',
      'TYPE_C': 'Matériel Ext.'
    };
    return map[type] || type;
  }

  getStatusClass(status: string): string {
    const map: any = {
      'ANALYZED': 'status-success',
      'PENDING':  'status-warning',
      'FAILED':   'status-danger'
    };
    return map[status] || 'status-default';
  }
}