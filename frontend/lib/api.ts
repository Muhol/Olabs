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

export async function updateSubject(token: string, subjectId: string, updates: { name?: string, is_compulsory?: boolean, class_id?: string, stream_id?: string }) {
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
