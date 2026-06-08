import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { PendingListPage } from '../shared/pending-list.page';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, ConfirmDialogComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent extends PendingListPage {

  kindOfUpdateOptions = ['Activation', 'Modification', 'Removal', 'Suspension', 'Reactivation'];

  protected documentType = 'EMPLOYEE';
  protected searchFields = ['name', 'company', 'department', 'site'];
  protected editableTextFields = [
    'name', 'company', 'site', 'department', 'mobile', 'officePhone',
    'kindOfUpdate', 'requester', 'requesterJobRole'
  ];

  constructor(api: ApiService) { super(api); }

  protected fetchConfirmed(): Observable<any[]> { return this.apiService.getAllEmployees(); }
  protected fetchConfirmedFile(id: string): Observable<Blob> { return this.apiService.getEmployeeFile(id); }

  getInitials(name: string): string { return this.initialsOf(name); }
  getAvatarColor(name: string): string { return this.avatarColorOf(name); }
}