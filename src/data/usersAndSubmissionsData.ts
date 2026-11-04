import { ExamSubmission, Student, Teacher } from '../types/cbt';
import { MA_RDM_REAL_STUDENTS } from './maRealStudents';

// Database santri real terisi dengan 147 santri MA (Kelas XI & XII) dari Rapor Digital Madrasah (RDM).
export const INITIAL_STUDENTS: Student[] = MA_RDM_REAL_STUDENTS;

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_SUBMISSIONS: ExamSubmission[] = [];
