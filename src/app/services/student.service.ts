import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Student, StudentFormData } from '../models/student.model';
import { StorageService } from './storage.service';
import { CepService } from './cep.service';

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
    students[studentIndex] = { ...students[studentIndex], ...studentData, updatedAt: new Date().toISOString() };
    this.studentsSubject.next([...students]);
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
    this.studentsSubject.next([...students]);
    this.storageService.saveStudents(students);
    return true;
  }

  getStudentById(studentId: number): Student | null {
    return this.getStudents().find(s => s.id === studentId) || null;
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
