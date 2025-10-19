import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../services/notification.service';
import { Student, StudentFormData, CepResponse } from '../../models/student.model';

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Inicializar modal Bootstrap apenas no browser
    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('studentModal');
      if (modalElement) {
        this.modal = new bootstrap.Modal(modalElement);
      }
    }
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
      this.isEditing = false;
      this.editingStudentId = null;
    }
    this.modal?.show();
  }

  private editStudent(studentId: number): void {
    const student = this.studentService.getStudentById(studentId);
    if (student) {
      this.formData = {
        name: student.name,
        phone: student.phone,
        cep: student.cep,
        address: student.address,
        number: student.number,
        neighborhood: student.neighborhood,
        city: student.city,
        state: student.state,
        returnAddress: student.returnAddress || ''
      };
      
      this.isEditing = true;
      this.editingStudentId = studentId;
    }
  }

  private resetForm(): void {
    this.formData = {
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
  }

  async searchCep(): Promise<void> {
    if (!this.formData.cep) {
      this.notificationService.showToast('Digite um CEP!', 'error');
      return;
    }

    try {
      const cepData = await this.studentService.searchCep(this.formData.cep);
      if (cepData) {
        this.formData.address = cepData.logradouro;
        this.formData.neighborhood = cepData.bairro;
        this.formData.city = cepData.localidade;
        this.formData.state = cepData.uf;
        this.notificationService.showToast('Endereço encontrado!', 'success');
      }
    } catch (error: any) {
      this.notificationService.showToast(error.message || 'Erro ao buscar CEP', 'error');
    }
  }

  formatCep(event: any): void {
    const value = event.target.value;
    this.formData.cep = this.studentService.formatCep(value);
  }

  saveStudent(): void {
    if (!this.formData.name || !this.formData.phone || !this.formData.address) {
      this.notificationService.showToast('Preencha todos os campos obrigatórios!', 'error');
      return;
    }

    try {
      if (this.isEditing && this.editingStudentId) {
        const success = this.studentService.updateStudent(this.editingStudentId, this.formData);
        if (success) {
          this.notificationService.showToast('Aluno atualizado com sucesso!', 'success');
        } else {
          this.notificationService.showToast('Erro ao atualizar aluno!', 'error');
        }
      } else {
        this.studentService.addStudent(this.formData);
        this.notificationService.showToast('Aluno cadastrado com sucesso!', 'success');
      }
      
      this.modal?.hide();
      this.resetForm();
    } catch (error) {
      this.notificationService.showToast('Erro ao salvar aluno!', 'error');
    }
  }

  closeModal(): void {
    this.modal?.hide();
    this.resetForm();
    this.isEditing = false;
    this.editingStudentId = null;
  }

  getModalTitle(): string {
    return this.isEditing ? 'Editar Aluno' : 'Cadastrar Aluno';
  }

  getSaveButtonText(): string {
    return this.isEditing ? 'Salvar Alterações' : 'Salvar Aluno';
  }
}
