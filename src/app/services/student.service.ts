import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Student, StudentFormData, CepResponse } from '../models/student.model';
import { StorageService } from './storage.service';
import { CepService, CepData } from './cep.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private studentsSubject = new BehaviorSubject<Student[]>([]);
  public students$ = this.studentsSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private cepService: CepService
  ) {
    // Carregar alunos salvos
    const savedStudents = this.storageService.getStudents();
    this.studentsSubject.next(savedStudents);
  }

  getStudents(): Student[] {
    return this.studentsSubject.value;
  }

  getGoingStudents(): Student[] {
    return this.getStudents().filter(s => s.going);
  }

  addStudent(studentData: StudentFormData): Student {
    const newStudent: Student = {
      id: Date.now(),
      ...studentData,
      going: true,
      createdAt: new Date().toISOString()
    };

    const students = [...this.getStudents(), newStudent];
    this.studentsSubject.next(students);
    this.storageService.saveStudents(students);
    
    return newStudent;
  }

  updateStudent(studentId: number, studentData: Partial<StudentFormData>): boolean {
    const students = this.getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      return false;
    }

    students[studentIndex] = {
      ...students[studentIndex],
      ...studentData,
      updatedAt: new Date().toISOString()
    };

    this.studentsSubject.next(students);
    this.storageService.saveStudents(students);
    return true;
  }

  deleteStudent(studentId: number): boolean {
    const students = this.getStudents().filter(s => s.id !== studentId);
    this.studentsSubject.next(students);
    this.storageService.saveStudents(students);
    return true;
  }

  toggleStudentPresence(studentId: number, going?: boolean): boolean {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      return false;
    }

    student.going = going !== undefined ? going : !student.going;
    student.updatedAt = new Date().toISOString();
    
    this.studentsSubject.next(students);
    this.storageService.saveStudents(students);
    return true;
  }

  getStudentById(studentId: number): Student | null {
    return this.getStudents().find(s => s.id === studentId) || null;
  }

  async searchCep(cep: string): Promise<CepResponse | null> {
    try {
      const cepData = await this.cepService.searchCep(cep);
      if (!cepData) {
        return null;
      }

      // Converter CepData para CepResponse
      const cepResponse: CepResponse = {
        cep: cepData.cep,
        logradouro: cepData.logradouro,
        complemento: cepData.complemento,
        bairro: cepData.bairro,
        localidade: cepData.localidade,
        uf: cepData.uf,
        ibge: cepData.ibge,
        gia: cepData.gia,
        ddd: cepData.ddd,
        siafi: cepData.siafi,
        erro: cepData.erro
      };

      return cepResponse;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      throw error;
    }
  }

  formatCep(cep: string): string {
    return this.cepService.formatCep(cep);
  }

  buildFullAddress(student: Student): string {
    let address = `${student.address}, ${student.number}`;
    if (student.neighborhood) {
      address += `, ${student.neighborhood}`;
    }
    address += `, ${student.city}`;
    if (student.state) {
      address += ` - ${student.state}`;
    }
    return address;
  }
}
