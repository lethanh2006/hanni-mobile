import useSWR, { mutate } from 'swr';

import { api, WEB_ORIGIN } from './api';
import { useAuth } from './auth';

/** Lớp học cho giáo viên / trung tâm — chép từ `lib/classrooms.ts` của hanni-client. Ai cũng tạo được lớp; người tạo là giáo viên. */

export interface Person {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface OwnedClass {
  id: string;
  name: string;
  code: string;
  hskLevel: number | null;
  createdAt: string;
  memberCount: number;
  assignmentCount: number;
}

export interface JoinedClass {
  id: string;
  name: string;
  hskLevel: number | null;
  teacher: Person;
  memberCount: number;
  joinedAt: string;
  pendingCount: number;
}

export interface MemberStats extends Person {
  joinedAt: string;
  currentStreak: number;
  minutes7d: number;
  daysActive7d: number;
  lastStudiedOn: string | null;
  lessonsCompleted: number;
  wordsStudied: number;
  examCount: number;
  bestExam: { slug: string; title: string; score: number; maxScore: number; passed: boolean } | null;
}

interface AssignmentBase {
  id: string;
  kind: 'LESSON' | 'MOCK_EXAM';
  dueAt: string | null;
  createdAt: string;
  label: string;
  href: string;
}

export interface OwnerAssignment extends AssignmentBase {
  doneCount: number;
  doneUserIds: string[];
}

export interface MemberAssignment extends AssignmentBase {
  done: boolean;
}

export interface PendingAssignment extends AssignmentBase {
  classId: string;
  className: string;
}

interface ClassInfo {
  id: string;
  name: string;
  hskLevel: number | null;
  createdAt: string;
  teacher: Person;
  memberCount: number;
}

export type ClassDetail =
  | {
      role: 'owner';
      class: ClassInfo & { code: string };
      members: MemberStats[];
      assignments: OwnerAssignment[];
      summary: { activeThisWeek: number; avgMinutes7d: number };
    }
  | {
      role: 'member';
      class: ClassInfo;
      assignments: MemberAssignment[];
      classmates: (Person & { minutes7d: number; currentStreak: number; isMe: boolean })[];
    };

export function useMyClassrooms() {
  const { user } = useAuth();
  return useSWR<{ owned: OwnedClass[]; joined: JoinedClass[] }>(user ? '/classrooms/mine' : null);
}

export function useClassroom(id: string | null) {
  return useSWR<ClassDetail>(id ? `/classrooms/${id}` : null);
}

/** Bài giao chưa làm ở mọi lớp — thẻ 'Bài tập của lớp' ở trang chủ. */
export function useMyAssignments() {
  const { user } = useAuth();
  return useSWR<PendingAssignment[]>(user ? '/classrooms/assignments/me' : null);
}

function refreshAll(id?: string) {
  void mutate('/classrooms/mine');
  void mutate('/classrooms/assignments/me');
  if (id) void mutate(`/classrooms/${id}`);
}

export async function createClassroom(input: { name: string; hskLevel?: number }) {
  const created = await api.post<{ id: string; name: string; code: string; hskLevel: number | null }>('/classrooms', input);
  refreshAll();
  return created;
}

export async function joinClassroom(code: string) {
  const r = await api.post<{ id: string }>(`/classrooms/code/${encodeURIComponent(code)}/join`);
  refreshAll(r.id);
  return r;
}

export async function leaveClassroom(id: string) {
  await api.post(`/classrooms/${id}/leave`);
  refreshAll();
}

export async function deleteClassroom(id: string) {
  await api.del(`/classrooms/${id}`);
  refreshAll();
}

export async function removeMember(id: string, userId: string) {
  await api.del(`/classrooms/${id}/members/${userId}`);
  refreshAll(id);
}

export async function addAssignment(
  id: string,
  input: { kind: 'LESSON'; lessonId: string; dueAt?: string } | { kind: 'MOCK_EXAM'; examSlug: string; dueAt?: string },
) {
  await api.post(`/classrooms/${id}/assignments`, input);
  refreshAll(id);
}

export async function removeAssignment(id: string, assignmentId: string) {
  await api.del(`/classrooms/${id}/assignments/${assignmentId}`);
  refreshAll(id);
}

/** Đường dẫn mời vào lớp — chia sẻ qua Zalo/Messenger hay dán vào Google Classroom. */
export function inviteUrl(code: string) {
  return `${WEB_ORIGIN}/lop/${code}`;
}

/** 'còn 2 ngày' / 'hôm nay' / 'quá hạn 1 ngày' theo ngày lịch Việt Nam. */
export function dueLabel(dueAt: string | null): { text: string; overdue: boolean } | null {
  if (!dueAt) return null;
  const day = (d: Date) => Math.floor((d.getTime() + 7 * 3600_000) / 86_400_000);
  const diff = day(new Date(dueAt)) - day(new Date());
  if (diff < 0) return { text: `quá hạn ${-diff} ngày`, overdue: true };
  if (diff === 0) return { text: 'hạn hôm nay', overdue: false };
  return { text: `còn ${diff} ngày`, overdue: false };
}
