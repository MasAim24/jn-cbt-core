import { ExamSubmission, Student, Teacher } from '../types/cbt';

// Database santri, guru/pejabat, dan rekap nilai dikosongkan secara default.
// Seluruh data real di lapangan diinput langsung melalui Akun Administrator Utama.
export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_SUBMISSIONS: ExamSubmission[] = [];
