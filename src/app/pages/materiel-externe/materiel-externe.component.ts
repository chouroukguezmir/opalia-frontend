import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-materiel-externe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './materiel-externe.component.html',
  styleUrls: ['../employees/employees.component.css'],
})
export class MaterielExterneComponent implements OnInit {

  items: any[] = [];
  filtered: any[] = [];
  isLoading = true;
  searchQuery = '';
  selected: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.apiService.getAllExternalMaterials().subscribe({
      next: (data: any[]) => {
        this.items    = data;
        this.filtered = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.filtered = [...this.items]; return; }
    this.filtered = this.items.filter(x =>
      x.prenom?.toLowerCase().includes(q) ||
      x.nom?.toLowerCase().includes(q) ||
      x.matricule?.toLowerCase().includes(q) ||
      x.societeUniversite?.toLowerCase().includes(q) ||
      x.role?.toLowerCase().includes(q) ||
      x.numeroTicket?.toLowerCase().includes(q)
    );
  }

  openDetail(x: any): void { this.selected = x; }
  closeDetail(): void { this.selected = null; }

  openAttachedFile(x: any): void {
    this.apiService.getExternalMaterialFile(x.id).subscribe({
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

  yesNo(v: any): string { return v ? '✅ Oui' : '— Non'; }
}