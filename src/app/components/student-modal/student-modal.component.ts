import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../services/notification.service';
import { CepService, CepData } from '../../services/cep.service';
import { StudentFormData } from '../../models/student.model';

declare var bootstrap: any;

@Component({
  selector: 'app-student-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-modal.component.html',
  styleUrls: ['./student-modal.component.css']
})
export class StudentModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private modal: any;
  
  isEditing = false;
  editingStudentId: number | null = null;
  isSearchingCep = false;
  
  formData: StudentFormData = {
    name: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    returnAddress: ''
  };

  constructor(
    private studentService: StudentService,
    private notificationService: NotificationService,
    public cepService: CepService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('studentModal');
      if (modalElement) {
        this.modal = new bootstrap.Modal(modalElement);
      }
    }

    this.cepService.loading$.pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isSearchingCep = loading);

    this.cepService.searchResult$.pipe(
      takeUntil(this.destroy$),
      filter((data): data is CepData => data !== null)
    ).subscribe(data => this.handleCepData(data));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openModal(studentId?: number): void {
    if (studentId) {
      this.editStudent(studentId);
    } else {
      this.resetForm();
    }
    this.modal?.show();
  }

  private editStudent(studentId: number): void {
    const student = this.studentService.getStudentById(studentId);
    if (student) {
      this.formData = { ...student, returnAddress: student.returnAddress || '' };
      this.isEditing = true;
      this.editingStudentId = studentId;
    }
  }

  private resetForm(): void {
    this.formData = {
      name: '', phone: '', cep: '', address: '',
      number: '', neighborhood: '', city: '', state: '', returnAddress: ''
    };
    this.isEditing = false;
    this.editingStudentId = null;
  }

  onCepChange(cep: string): void {
    const cleanCep = cep.replace(/\D/g, '');
    this.formData.cep = this.cepService.formatCep(cleanCep);
    if (this.cepService.isValidCep(cleanCep)) {
      this.cepService.searchCep(cleanCep);
    }
  }

  private handleCepData(data: CepData): void {
    this.formData.address = data.logradouro;
    this.formData.neighborhood = data.bairro;
    this.formData.city = data.localidade;
    this.formData.state = data.uf;
    this.notificationService.showToast('Endereço encontrado!', 'success');
  }

  saveStudent(form: NgForm): void {
    if (form.invalid) {
      this.notificationService.showToast('Preencha todos os campos obrigatórios!', 'error');
      return;
    }

    try {
      if (this.isEditing && this.editingStudentId) {
        this.studentService.updateStudent(this.editingStudentId, this.formData);
        this.notificationService.showToast('Aluno atualizado com sucesso!', 'success');
      } else {
        this.studentService.addStudent(this.formData);
        this.notificationService.showToast('Aluno cadastrado com sucesso!', 'success');
      }
      this.closeModal();
    } catch (error) {
      this.notificationService.showToast('Erro ao salvar aluno!', 'error');
    }
  }

  closeModal(): void {
    this.modal?.hide();
    this.resetForm();
  }

  getModalTitle(): string {
    return this.isEditing ? 'Editar Aluno' : 'Cadastrar Aluno';
  }
}
