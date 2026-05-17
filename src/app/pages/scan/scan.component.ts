import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './scan.component.html',
  styleUrl: './scan.component.css'
})
export class ScanComponent {

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  result: any = null;
  errorMessage = '';

  acceptedTypes = [
    'application/pdf',
    'image/png', 'image/jpeg', 'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  constructor(private apiService: ApiService) {}

  onDragOver(e: DragEvent)  { e.preventDefault(); this.isDragging = true; }
  onDragLeave()              { this.isDragging = false; }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.selectFile(file);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.selectFile(file);
  }

  selectFile(file: File) {
    if (!this.acceptedTypes.includes(file.type)) {
      this.errorMessage = 'Format non supporté. Utilisez PDF, PNG, JPG ou DOCX.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Fichier trop grand. Maximum 10 MB.';
      return;
    }
    this.selectedFile  = file;
    this.errorMessage  = '';
    this.result        = null;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => { this.previewUrl = ev.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  onUpload() {
    if (!this.selectedFile) return;

    this.isUploading    = true;
    this.uploadProgress = 0;
    this.errorMessage   = '';
    this.result         = null;

    const interval = setInterval(() => {
      if (this.uploadProgress < 85)
        this.uploadProgress += Math.random() * 12;
    }, 500);

    this.apiService.uploadDocument(this.selectedFile).subscribe({
      next: (data: any) => {
        clearInterval(interval);
        this.uploadProgress = 100;
        setTimeout(() => {
          this.isUploading = false;
          this.result = data;
        }, 400);
      },
      error: () => {
        clearInterval(interval);
        this.isUploading    = false;
        this.uploadProgress = 0;
        this.errorMessage   = 'Erreur lors de l\'analyse. Vérifiez que le backend est actif.';
      }
    });
  }

  resetScan() {
    this.selectedFile   = null;
    this.previewUrl     = null;
    this.result         = null;
    this.errorMessage   = '';
    this.uploadProgress = 0;
    this.isUploading    = false;
  }

  getFileIcon(): string {
    if (!this.selectedFile) return '📄';
    if (this.selectedFile.type === 'application/pdf')     return '📕';
    if (this.selectedFile.type.startsWith('image/'))      return '🖼️';
    if (this.selectedFile.type.includes('word'))          return '📘';
    return '📄';
  }

  getFileSizeMB(): string {
    return this.selectedFile
      ? (this.selectedFile.size / 1024 / 1024).toFixed(2)
      : '0';
  }

  getDocTypeLabel(type: string): string {
    const m: any = {
      'EMPLOYEE': 'Fiche Employé (E DSI 3812)',
      'TYPE_A':   'Droits Accès (E DSI 3813)',
      'TYPE_B':   'Matériels (E DSI 3328)',
      'TYPE_C':   'Matériel Externe (E DSI 3797)',
    };
    return m[type] || type || 'Inconnu';
  }

  getDocTypeIcon(type: string): string {
    const m: any = { EMPLOYEE:'👤', TYPE_A:'🔐', TYPE_B:'💻', TYPE_C:'🔌' };
    return m[type] || '📄';
  }

  getStatusLabel(status: string): string {
    const m: any = {
      'PENDING_CONFIRMATION': 'En attente de confirmation',
      'FAILED':               'Échec de l\'analyse',
      'PROCESSING':           'En cours...',
    };
    return m[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'PENDING_CONFIRMATION') return 'status-warning';
    if (status === 'FAILED')              return 'status-danger';
    return 'status-default';
  }
}