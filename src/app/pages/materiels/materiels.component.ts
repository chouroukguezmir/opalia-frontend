import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-materiels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './materiels.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class MaterielsComponent implements OnInit {

  materials: any[] = [];
  filtered: any[] = [];
  isLoading = true;
  searchQuery = '';
  selected: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.apiService.getAllMaterials().subscribe({
      next: (data: any[]) => {
        this.materials = data;
        this.filtered  = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.filtered = [...this.materials]; return; }
    this.filtered = this.materials.filter(m =>
      m.prenom?.toLowerCase().includes(q) ||
      m.nom?.toLowerCase().includes(q) ||
      m.matricule?.toLowerCase().includes(q) ||
      m.societe?.toLowerCase().includes(q) ||
      m.direction?.toLowerCase().includes(q) ||
      m.numeroTicket?.toLowerCase().includes(q)
    );
  }

  openDetail(mat: any): void { this.selected = mat; }
  closeDetail(): void { this.selected = null; }

  openAttachedFile(mat: any): void {
    this.apiService.getMaterialFile(mat.id).subscribe({
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

  /** Liste des matériels cochés (pour les chips de la carte). */
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

  yesNo(v: any): string { return v ? '✅ Oui' : '— Non'; }
}