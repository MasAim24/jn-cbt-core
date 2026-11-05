import { ExamPacket, ExamSubmission, Teacher } from '../types/cbt';
import { AuthenticatedSession } from '../components/auth/LoginPortalView';

const GENERIC_GURU_LABELS = new Set([
  '',
  '-',
  'tim kurikulum / guru mapel',
  'guru mapel',
  'ustadz pengampu',
  'pengampu',
]);

function normalizeText(val?: string): string {
  return (val || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks whether the current logged-in session has full unit-level management rights
 * (Master Admin, Kepala Madrasah / Mudir, or Koordinator Kurikulum).
 */
export function isUnitManagerSession(
  session?: AuthenticatedSession | null,
  teacher?: Teacher
): boolean {
  if (!session || session.role === 'admin') return true;
  if (session.role !== 'guru') return false;
  const peran = teacher?.peran || session.peran;
  return peran === 'Kepala Madrasah / Mudir' || peran === 'Koordinator Kurikulum';
}

/**
 * Determines whether a teacher session is allowed to view, edit, and delete a given ExamPacket.
 * - Admin: full access to all packets.
 * - Kepala Madrasah / Mudir & Koordinator Kurikulum: full access to all packets in their allowedJenjangs.
 * - Guru Mapel (and other non-leader guru roles): strictly isolated to packets they created/own
 *   (matched by guruId, or for legacy packets without guruId, by guruNama / mapelAmpu).
 */
export function canTeacherAccessPacket(
  pkt: ExamPacket,
  session?: AuthenticatedSession | null,
  teacher?: Teacher
): boolean {
  if (!session || session.role === 'admin') return true;
  if (session.role !== 'guru') return false;

  const allowedJenjangs =
    teacher?.jenjangAmpu && teacher.jenjangAmpu.length > 0
      ? teacher.jenjangAmpu
      : session.allowedJenjangs && session.allowedJenjangs.length > 0
      ? session.allowedJenjangs
      : session.jenjang
      ? [session.jenjang]
      : [];

  if (allowedJenjangs.length > 0 && !allowedJenjangs.includes(pkt.jenjang)) {
    return false;
  }

  if (isUnitManagerSession(session, teacher)) {
    return true;
  }

  // 1. Strict ID match if packet already records guruId
  if (pkt.guruId) {
    return pkt.guruId === session.id;
  }

  // 2. Fallback for legacy packets created before guruId was introduced: match by teacher name
  const pktGuru = normalizeText(pkt.guruNama);
  const sessionName = normalizeText(session.name);
  const rawTeacherName = normalizeText(teacher?.nama);
  const fullTeacherName = normalizeText(
    teacher ? (teacher.gelar ? `${teacher.nama}, ${teacher.gelar}` : teacher.nama) : ''
  );

  if (pktGuru && !GENERIC_GURU_LABELS.has(pktGuru)) {
    if (
      (sessionName && pktGuru === sessionName) ||
      (rawTeacherName && pktGuru === rawTeacherName) ||
      (fullTeacherName && pktGuru === fullTeacherName) ||
      (rawTeacherName.length >= 3 && pktGuru.includes(rawTeacherName)) ||
      (sessionName.length >= 3 && pktGuru.includes(sessionName))
    ) {
      return true;
    }
    // Packet explicitly names a different teacher
    return false;
  }

  // 3. Fallback when guruNama is generic ("Tim Kurikulum / Guru Mapel"): match by mapelAmpu if specified
  const teacherMapel = normalizeText(teacher?.mapelAmpu || session.mapelAmpu);
  const pktMapel = normalizeText(pkt.mapel);
  if (teacherMapel && !GENERIC_GURU_LABELS.has(teacherMapel) && pktMapel === teacherMapel) {
    return true;
  }

  return false;
}

/**
 * Determines whether a teacher session can view/grade a given ExamSubmission in Rekap Nilai.
 */
export function canTeacherAccessSubmission(
  sub: ExamSubmission,
  ownedPacketIds: Set<string>,
  session?: AuthenticatedSession | null,
  teacher?: Teacher
): boolean {
  if (!session || session.role === 'admin') return true;
  if (session.role !== 'guru') return false;

  const allowedJenjangs =
    teacher?.jenjangAmpu && teacher.jenjangAmpu.length > 0
      ? teacher.jenjangAmpu
      : session.allowedJenjangs && session.allowedJenjangs.length > 0
      ? session.allowedJenjangs
      : session.jenjang
      ? [session.jenjang]
      : [];

  if (allowedJenjangs.length > 0 && !allowedJenjangs.includes(sub.jenjang)) {
    return false;
  }

  const peran = teacher?.peran || session.peran;
  if (
    peran === 'Kepala Madrasah / Mudir' ||
    peran === 'Koordinator Kurikulum' ||
    peran === 'Wali Kelas' ||
    peran === 'Pengawas CBT'
  ) {
    return true;
  }

  // For Guru Mapel: match owned packets or mapelAmpu
  if (sub.packetId && ownedPacketIds.has(sub.packetId)) {
    return true;
  }

  const teacherMapel = normalizeText(teacher?.mapelAmpu || session.mapelAmpu);
  const subMapel = normalizeText(sub.mapel);
  if (teacherMapel && !GENERIC_GURU_LABELS.has(teacherMapel) && subMapel === teacherMapel) {
    return true;
  }

  return false;
}
