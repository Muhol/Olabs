const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchBooks(token?: string | null, skip: number = 0, limit: number = 100, search: string = '') {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const params: any = { skip: skip.toString(), limit: limit.toString() };
  if (search) params.search = search;

  const query = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/books?${query}`, { headers });
  if (!response.ok) throw new Error('Failed to fetch books');
  return response.json();
}

export async function createBook(token: string, book: any) {
  const response = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(book)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create book');
  }
  return response.json();
}

export async function updateBook(token: string, bookUuid: string, updates: any) {
  const response = await fetch(`${API_BASE_URL}/books/${bookUuid}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update book');
  }
  return response.json();
}

export async function deleteBook(token: string, bookUuid: string) {
  const response = await fetch(`${API_BASE_URL}/books/${bookUuid}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete book');
  return response.json();
}

export async function fetchStudents(token: string, skip: number = 0, limit: number = 100, search: string = '', classId?: string, streamId?: string, subjectId?: string) {
  const params: any = { skip: skip.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (classId) params.class_id = classId;
  if (streamId) params.stream_id = streamId;
  if (subjectId) params.subject_id = subjectId;

  const query = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/students?${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Unauthorized or failed to fetch students');
  return response.json();
}

export async function createStudent(token: string, student: any) {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(student)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create student');
  }
  return response.json();
}

export async function updateStudent(token: string, studentUuid: string, updates: any) {
  const response = await fetch(`${API_BASE_URL}/students/${studentUuid}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update student');
  }
  return response.json();
}

export async function deleteStudent(token: string, studentUuid: string) {
  const response = await fetch(`${API_BASE_URL}/students/${studentUuid}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete student');
  return response.json();
}

export async function clearStudent(token: string, studentId: string) {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}/clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Clearance failed');
  }
  return response.json();
}

export async function promoteStudents(token: string) {
  const response = await fetch(`${API_BASE_URL}/students/promote`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Promotion failed');
  }
  return response.json();
}

export async function resetStudentAccount(token: string, studentId: string) {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}/reset-account`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Reset failed');
  }
  return response.json();
}

export async function fetchStudentAttendance(token: string, studentId: string) {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}/attendance`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch student attendance');
  return response.json();
}

export async function fetchClasses(token: string) {
  const response = await fetch(`${API_BASE_URL}/classes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch classes');
  return response.json();
}

export async function createClass(token: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/classes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error('Failed to create class');
  return response.json();
}

export async function deleteClass(token: string, classUuid: string) {
  const response = await fetch(`${API_BASE_URL}/classes/${classUuid}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete class');
  }
  return response.json();
}

export async function fetchStreams(token: string, classId?: string) {
  const query = classId ? `?class_id=${classId}` : '';
  const response = await fetch(`${API_BASE_URL}/streams${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch streams');
  return response.json();
}

export async function createStream(token: string, stream: { name: string, class_id: string }) {
  const response = await fetch(`${API_BASE_URL}/streams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stream)
  });
  if (!response.ok) throw new Error('Failed to create stream');
  return response.json();
}

export async function updateStream(token: string, streamUuid: string, updates: { name: string }) {
  const response = await fetch(`${API_BASE_URL}/streams/${streamUuid}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update stream');
  return response.json();
}

export async function deleteStream(token: string, streamUuid: string) {
  const response = await fetch(`${API_BASE_URL}/streams/${streamUuid}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete stream');
  return response.json();
}

export async function borrowBook(token: string, bookId: string, studentId: string, bookNumber?: string) {
  const body: any = { book_id: bookId, student_id: studentId };
  if (bookNumber) body.book_number = bookNumber;

  const response = await fetch(`${API_BASE_URL}/borrow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to borrow book');
  }
  return response.json();
}

export async function returnBook(token: string, transactionUuid: string, bookNumber?: string) {
  const headers: any = { 'Authorization': `Bearer ${token}` };
  let body = undefined;

  if (bookNumber) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ book_number: bookNumber });
  }

  const response = await fetch(`${API_BASE_URL}/return/${transactionUuid}`, {
    method: 'POST',
    headers,
    body
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to return book');
  }
  return response.json();
}

export async function fetchBorrowHistory(token: string, skip: number = 0, limit: number = 100, search: string = '', studentId?: string) {
  const params: any = { skip: skip.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (studentId) params.student_id = studentId;

  const query = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/history?${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch borrow history');
  return response.json();
}

export async function fetchAnalytics(token: string) {
  const response = await fetch(`${API_BASE_URL}/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export async function checkAuthPolicy(email?: string) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  const response = await fetch(`${API_BASE_URL}/auth/check-policy${query}`);
  if (!response.ok) throw new Error('Policy check failed');
  return response.json();
}


export async function fetchConfig(token: string) {
  const response = await fetch(`${API_BASE_URL}/config`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch config');
  return response.json();
}

export async function updateConfig(token: string, updates: { allow_public_signup?: boolean }) {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
}


export async function fetchLogs(token: string, level?: string, search?: string) {
  const params: any = {};
  if (level) params.level = level;
  if (search) params.search = search;

  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/logs${query ? `?${query}` : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch system logs');
  return response.json();
}

export async function fetchCurrentUser(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error: any = new Error('Failed to fetch user profile from database');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function fetchUserDetail(token: string, userId: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch user details');
  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

export async function fetchStaff(token: string, search?: string, roleFilter?: string) {
  const params: any = {};
  if (search) params.search = search;
  if (roleFilter) params.role_filter = roleFilter;

  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/staff${query ? `?${query}` : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch staff');
  return response.json();
}

export async function updateUserRole(token: string, userId: string, role: string, class_id?: string, stream_id?: string, subroles?: string[]) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role, class_id, stream_id, subroles })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update user role');
  }
  return response.json();
}

export async function fetchSubjects(token: string, availableForTeacher?: string, skip: number = 0, limit: number = 100, search?: string) {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString()
  });
  if (availableForTeacher) params.append('available_for_teacher', availableForTeacher);
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/subjects?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subjects');
  return response.json();
}

export async function fetchAllSubjects(token: string, search?: string) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/subjects/all?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subjects');
  return response.json();
}

export async function fetchSubjectsByClassAndStream(token: string, classId: string, streamId?: string) {
  const params = new URLSearchParams({ class_id: classId });
  if (streamId) params.append('stream_id', streamId);

  const response = await fetch(`${API_BASE_URL}/subjects/by-class-stream?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subjects by class/stream');
  return response.json();
}


export async function createSubject(token: string, subject: { name: string, is_compulsory: boolean, class_id: string, stream_id?: string, teacher_id?: string }) {
  const response = await fetch(`${API_BASE_URL}/subjects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subject)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create subject');
  }
  return response.json();
}

export async function updateSubject(token: string, subjectId: string, updates: { name?: string, is_compulsory?: boolean, class_id?: string, stream_id?: string, teacher_id?: string | null }) {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update subject');
  }
  return response.json();
}

export async function deleteSubject(token: string, subjectId: string) {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete subject');
  }
  return response.json();
}

export async function assignSubjectsToStudent(token: string, studentId: string, subjectIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/subjects/assign/student/${studentId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subject_ids: subjectIds })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to assign subjects to student');
  }
  return response.json();
}

export async function assignSubjectsToTeacher(token: string, userId: string, subjectIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/subjects/assign/teacher/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subject_ids: subjectIds })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to assign subjects to teacher');
  }
  return response.json();
}

// New functions for class-based assignments
export async function assignSubjectsToTeacherWithClasses(
  token: string,
  teacherId: string,
  assignments: Array<{ subject_id: string, class_id: string, stream_id?: string }>
) {
  const response = await fetch(`${API_BASE_URL}/subjects/assign/teacher/${teacherId}/with-classes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ assignments })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to assign subjects with classes');
  }
  return response.json();
}

export async function batchUpdateTeacherAssignments(token: string, assignments: { subject_id: string, teacher_id: string | null }[]) {
  const response = await fetch(`${API_BASE_URL}/subjects/batch-update-teacher`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ assignments })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to perform batch update');
  }
  return response.json();
}

export async function getTeacherSubjectAssignments(token: string, teacherId: string) {
  const response = await fetch(`${API_BASE_URL}/subjects/teacher/${teacherId}/assignments`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch teacher assignments');
  }
  return response.json();
}

export async function enrollStudentsToSubject(token: string, subjectId: string, studentIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/enroll`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ student_ids: studentIds })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to enroll students');
  }
  return response.json();
}

export async function fetchEnrolledStudentIds(token: string, subjectId: string) {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/enrolled-ids`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch enrolled student IDs');
  }
  return response.json();
}

// Assignment APIs
export async function fetchAssignments(token: string, teacherId?: string, subjectId?: string) {
  let url = `${API_BASE_URL}/assignments`;
  const params = new URLSearchParams();
  if (teacherId) params.append('teacher_id', teacherId);
  if (subjectId) params.append('subject_id', subjectId);
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch assignments');
  }
  return response.json();
}

export async function createAssignment(token: string, formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/assignments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Note: Do NOT set Content-Type for FormData, the browser will set it with the boundary
    },
    body: formData
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create assignment');
  }
  return response.json();
}

export async function deleteAssignment(token: string, assignmentId: string) {
  const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete assignment');
  }
  return response.json();
}

// Timetable APIs
export async function fetchTimetableByStream(token: string, streamId: string) {
  const response = await fetch(`${API_BASE_URL}/timetable/stream/${streamId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch stream timetable');
  }
  return response.json();
}

export async function fetchAllTimetables(token: string) {
  const response = await fetch(`${API_BASE_URL}/timetable/all`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch all timetables');
  }
  return response.json();
}

export async function bulkCreateTimetableSlots(token: string, slots: any[]) {
  const response = await fetch(`${API_BASE_URL}/timetable/bulk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ slots })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to bulk create timetable slots');
  }
  return response.json();
}

export async function bulkDeleteTimetableSlots(token: string, filters: any) {
  const response = await fetch(`${API_BASE_URL}/timetable/bulk`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(filters)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to bulk delete timetable slots');
  }
  return response.json();
}

export async function deleteTimetableSlot(token: string, slotId: string) {
  const response = await fetch(`${API_BASE_URL}/timetable/${slotId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete timetable slot');
  }
  return response.json();
}

export async function updateTimetableSlot(token: string, slotId: string, updates: any) {
  const response = await fetch(`${API_BASE_URL}/timetable/${slotId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update timetable slot');
  }
  return response.json();
}

export async function bulkUpdateTimetableSlots(token: string, updates: any[]) {
  const response = await fetch(`${API_BASE_URL}/timetable/bulk`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ updates })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to bulk update timetable slots');
  }
  return response.json();
}

// Attendance APIs
export async function submitAttendance(token: string, data: { subject_id: string, date: string, students: { student_id: string, status: string }[] }) {
  const response = await fetch(`${API_BASE_URL}/attendance/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to submit attendance');
  }
  return response.json();
}

export async function fetchAttendanceSession(token: string, subjectId: string, date: string) {
  const response = await fetch(`${API_BASE_URL}/attendance/session/${subjectId}/${date}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    if (response.status === 404) return null; // Handle not found gracefully
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch attendance session');
  }
  return response.json();
}

export async function fetchSessionRecords(token: string, sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/attendance/records/${sessionId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch session records');
  }
  return response.json();
}

// CBC & Grading APIs

export async function fetchCompetencies(token: string) {
  const response = await fetch(`${API_BASE_URL}/cbc/competencies`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch competencies');
  return response.json();
}

export async function fetchSubjectCompetencies(token: string, subjectId: string) {
  const response = await fetch(`${API_BASE_URL}/cbc/subjects/${subjectId}/competencies`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subject competencies');
  return response.json();
}

export async function createCompetencyWithRubrics(token: string, competency: any) {
  const response = await fetch(`${API_BASE_URL}/cbc/competencies/with-rubrics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(competency)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create competency');
  }
  return response.json();
}

export async function createCompetencyAssessment(token: string, assessment: any) {
  const response = await fetch(`${API_BASE_URL}/cbc/assessments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assessment)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create assessment');
  }
  return response.json();
}

export async function fetchStudentAssessments(token: string, studentId: string, subjectId?: string) {
  let url = `${API_BASE_URL}/cbc/assessments/student/${studentId}`;
  if (subjectId) url += `?subject_id=${subjectId}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch student assessments');
  return response.json();
}

export async function createRubric(token: string, rubric: any) {
  const response = await fetch(`${API_BASE_URL}/cbc/rubrics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rubric)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create rubric');
  }
  return response.json();
}

export async function bulkCreateRubrics(token: string, rubrics: any[]) {
  const response = await fetch(`${API_BASE_URL}/cbc/rubrics/bulk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rubrics)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to bulk create rubrics');
  }
  return response.json();
}

export async function fetchSubjectRubrics(token: string, subjectId: string) {
  const response = await fetch(`${API_BASE_URL}/cbc/rubrics/subject/${subjectId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subject rubrics');
  return response.json();
}

export async function createSubjectSummary(token: string, summary: any) {
  const response = await fetch(`${API_BASE_URL}/cbc/summaries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(summary)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create subject summary');
  }
  return response.json();
}

export async function fetchStudentTermSummaries(token: string, studentId: string) {
  const response = await fetch(`${API_BASE_URL}/cbc/summaries/student/${studentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch student term summaries');
  return response.json();
}

export async function fetchSubjectTermResults(token: string, subjectId: string, term?: string, year?: number) {
  const params = new URLSearchParams();
  if (term) params.append('term', term);
  if (year) params.append('year', year.toString());

  const response = await fetch(`${API_BASE_URL}/cbc/summaries/subject/${subjectId}?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subject term summaries');
  return response.json();
}

export async function createExamResult(token: string, result: any) {
  const response = await fetch(`${API_BASE_URL}/cbc/exams/results`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create exam result');
  }
  return response.json();
}

export async function bulkCreateExamResults(token: string, results: any[], summaries?: any[], assessments?: any[]) {
  const response = await fetch(`${API_BASE_URL}/cbc/exams/results/bulk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ results, summaries, assessments })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to bulk create exam results');
  }
  return response.json();
}

export async function fetchExamResults(token: string, studentId?: string, subjectId?: string, term?: string, year?: number) {
  const params = new URLSearchParams();
  if (studentId) params.append('student_id', studentId);
  if (subjectId) params.append('subject_id', subjectId);
  if (term) params.append('term', term);
  if (year) params.append('year', year.toString());

  const response = await fetch(`${API_BASE_URL}/cbc/exams/results?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch exam results');
  }
  return response.json();
}

export async function submitAssignmentGrade(token: string, submissionId: string, updateData: any) {
  const response = await fetch(`${API_BASE_URL}/assignments/submissions/${submissionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to grade assignment');
  }
  return response.json();
}

export async function fetchSubjectRubric(token: string, subjectId: string) {
  const response = await fetch(`${API_BASE_URL}/cbc/rubrics/subject/${subjectId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const data = await response.json();
    throw new Error(data.detail || 'Failed to fetch rubric');
  }
  return response.json();
}

export async function fetchSubjectAssessments(token: string, subjectId: string, term?: string, year?: number) {
  const params = new URLSearchParams();
  if (term) params.append('term', term);
  if (year) params.append('year', year.toString());

  const response = await fetch(`${API_BASE_URL}/cbc/assessments/subject/${subjectId}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subject assessments');
  return response.json();
}

export async function fetchSubjectExams(token: string, subjectId: string, term?: string, year?: number) {
  const params = new URLSearchParams();
  if (term) params.append('term', term);
  if (year) params.append('year', year.toString());

  const response = await fetch(`${API_BASE_URL}/cbc/exams/subject/${subjectId}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subject exams');
  return response.json();
}

export async function createExam(token: string, examData: any) {
  const response = await fetch(`${API_BASE_URL}/cbc/exams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(examData)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create exam');
  }
  return response.json();
}

export async function deleteExam(token: string, examId: string) {
  const response = await fetch(`${API_BASE_URL}/cbc/exams/${examId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete exam');
  }
  return response.json();
}

export async function updateExamCompetencies(token: string, examId: string, competencyIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/cbc/exams/${examId}/competencies`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ competency_ids: competencyIds })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update exam competencies');
  }
  return response.json();
}

// ─── Report Items (Admin-managed competencies & values) ──────────────────────
export async function fetchReportItems(token: string, type?: 'competency' | 'value') {
  const params = type ? `?type=${type}` : '';
  const response = await fetch(`${API_BASE_URL}/report-items/${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch report items');
  return response.json();
}

export async function createReportItem(token: string, data: { name: string; type: string; description?: string; order?: number }) {
  const response = await fetch(`${API_BASE_URL}/report-items/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create report item');
  return response.json();
}

export async function updateReportItem(token: string, itemId: string, data: { name: string; type: string; description?: string; order?: number }) {
  const response = await fetch(`${API_BASE_URL}/report-items/${itemId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update report item');
  return response.json();
}

export async function deleteReportItem(token: string, itemId: string) {
  const response = await fetch(`${API_BASE_URL}/report-items/${itemId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete report item');
  return response.json();
}

export async function fetchHeadTeacherComments(token: string) {
  const response = await fetch(`${API_BASE_URL}/head-teacher-comments`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch head teacher comments');
  return response.json();
}

export async function upsertHeadTeacherComment(token: string, level: string, data: { level: string; comment: string }) {
  const response = await fetch(`${API_BASE_URL}/head-teacher-comments/${level}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update head teacher comment');
  return response.json();
}

export async function fetchClassScoreSheet(token: string, term?: string, year?: number) {
  let url = `${API_BASE_URL}/cbc/class-score-sheet`;
  const params = new URLSearchParams();
  if (term) params.append('term', term);
  if (year) params.append('year', year.toString());
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch class score sheet');
  return response.json();
}

export async function fetchFullReportCard(token: string, studentId: string, term?: string, year?: number) {
  const params = new URLSearchParams();
  if (term) params.append('term', term);
  if (year) params.append('year', year.toString());

  const response = await fetch(`${API_BASE_URL}/cbc/term-reports/${studentId}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch report card data');
  return response.json();
}

export async function saveTermReport(token: string, reportData: any) {
  const response = await fetch(`${API_BASE_URL}/cbc/term-reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reportData)
  });
  if (!response.ok) throw new Error('Failed to save term report');
  return response.json();
}

export const fetchDBStatus = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/config/db-status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch database status');
  return response.json();
};

export const cleanupDB = async (token: string, tables: string[]) => {
  const response = await fetch(`${API_BASE_URL}/config/db-cleanup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tables })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Database cleanup failed');
  }
  return response.json();
};

export async function fetchTermExams(token: string) {
  const response = await fetch(`${API_BASE_URL}/admin/exams`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch global term exams');
  return response.json();
}

export async function fetchPreferredTerm(token: string) {
  const response = await fetch(`${API_BASE_URL}/admin/exams/current`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch preferred term session');
  return response.json();
}

export async function createTermExam(token: string, data: { name: string, term: string, year: number }) {
  const response = await fetch(`${API_BASE_URL}/admin/exams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create global term exam');
  }
  return response.json();
}

export async function updateTermExam(token: string, examId: string, data: { name?: string, term?: string, year?: number, edit_status?: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/exams/${examId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update global term exam');
  }
  return response.json();
}

export async function batchUpdateTermExams(token: string, data: { term: string, year: number, edit_status: string }) {
  const response = await fetch(`${API_BASE_URL}/admin/exams/batch`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to batch update term exams');
  }
  return response.json();
}

export async function deleteTermExam(token: string, examId: string) {
  const response = await fetch(`${API_BASE_URL}/admin/exams/${examId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete global term exam');
  return response.json();
}

export async function purgeAllSubjects(token: string) {
  const response = await fetch(`${API_BASE_URL}/subjects/all/danger`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to purge subjects');
  }
  return response.json();
}
export async function recalculateSubjectSummaries(token: string, subjectId: string, term: string, year: number) {
  const query = new URLSearchParams({ term, year: year.toString() });
  const response = await fetch(`${API_BASE_URL}/cbc/subjects/${subjectId}/recalculate-summaries?${query}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to recalculate summaries');
  }
  return response.json();
}
export async function fetchAnnouncements(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/features/announcements`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch announcements');
  return response.json();
}

export async function createAnnouncement(token: string, announcement: any) {
  const response = await fetch(`${API_BASE_URL}/api/features/announcements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(announcement)
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to create announcement');
  }
  return response.json();
}

export async function deleteAnnouncement(token: string, announcementId: string) {
  const response = await fetch(`${API_BASE_URL}/api/features/announcements/${announcementId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete announcement');
  }
  return response.json();
}
