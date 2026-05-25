import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dialogue de confirmation réutilisable — remplace le `confirm()` natif du navigateur.
 *
 * Usage :
 *   <app-confirm-dialog
 *     [open]="showRejectConfirm"
 *     title="⚠️ Rejeter le document"
 *     message="Êtes-vous sûr de vouloir rejeter ce document ?"
 *     confirmLabel="✕ Rejeter"
 *     [danger]="true"
 *     (confirm)="confirmReject()"
 *     (cancel)="cancelReject()">
 *   </app-confirm-dialog>
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  /** Affiche (true) ou masque (false) le dialogue. */
  @Input() open = false;
  @Input() title = 'Confirmer';
  @Input() message = 'Êtes-vous sûr ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() cancelLabel = 'Annuler';
  /** Style « danger » (rouge) pour le bouton de confirmation. */
  @Input() danger = false;
  /** Désactive les boutons (ex. pendant une requête en cours). */
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}