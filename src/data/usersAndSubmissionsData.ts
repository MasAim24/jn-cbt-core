import { ExamSubmission, Student, Teacher } from '../types/cbt';
import { MA_RDM_REAL_STUDENTS } from './maRealStudents';
import { MTS_RDM_REAL_STUDENTS } from './mtsRealStudents';

// Database santri real terisi dengan 225 santri MTs (Kelas VII, VIII & IX) dan 147 santri MA (Kelas XI & XII) dari RDM.
export const INITIAL_STUDENTS: Student[] = [
  ...MTS_RDM_REAL_STUDENTS,
  ...MA_RDM_REAL_STUDENTS,
];

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_SUBMISSIONS: ExamSubmission[] = [];
