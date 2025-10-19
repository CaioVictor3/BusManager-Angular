import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/student.model';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  students: Student[] = [];

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.studentService.students$
      .pipe(takeUntil(this.destroy$))
      .subscribe(students => {
        this.students = students.sort((a, b) => 
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleStudentPresence(studentId: number, going?: boolean): void {
    this.studentService.toggleStudentPresence(studentId, going);
  }

  editStudent(studentId: number): void {
    // Implementar abertura do modal de edição
    console.log('Editar aluno:', studentId);
  }

  deleteStudent(studentId: number): void {
    const student = this.students.find(s => s.id === studentId);
    if (student && confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      this.studentService.deleteStudent(studentId);
    }
  }

  getStudentCardClass(student: Student): string {
    return `student-card ${student.going ? 'selected' : 'not-going'}`;
  }

  getStatusIndicatorClass(student: Student): string {
    return `status-indicator ${student.going ? 'going' : 'not-going'}`;
  }

  getPresenceButtonClass(student: Student, isGoing: boolean): string {
    return `btn btn-sm presence-btn ${isGoing ? (student.going ? 'active' : '') : (!student.going ? 'active' : '')}`;
  }

  getPresenceButtonClassVariant(student: Student, isGoing: boolean): string {
    return isGoing ? 'btn-success' : 'btn-danger';
  }

  getPresenceButtonIcon(isGoing: boolean): string {
    return isGoing ? 'fas fa-check' : 'fas fa-times';
  }

  getPresenceButtonText(isGoing: boolean): string {
    return isGoing ? 'Vai' : 'Não vai';
  }
}
