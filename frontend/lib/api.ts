const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export async function fetchStudents(token: string, skip: number = 0, limit: number = 100, search: string = '', classId?: string, streamId?: string) {
  const params: any = { skip: skip.toString(), limit: limit.toString() };
  if (search) params.search = search;
  if (classId) params.class_id = classId;
  if (streamId) params.stream_id = streamId;

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

export async function borrowBook(token: string, bookId: string, studentId: string) {
  const response = await fetch(`${API_BASE_URL}/borrow?book_id=${bookId}&student_id=${studentId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to borrow book');
  }
  return response.json();
}

export async function returnBook(token: string, transactionUuid: string) {
  const response = await fetch(`${API_BASE_URL}/return/${transactionUuid}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to return book');
  }
  return response.json();
}

export async function fetchBorrowHistory(token: string, skip: number = 0, limit: number = 100, search: string = '') {
  const params: any = { skip: skip.toString(), limit: limit.toString() };
  if (search) params.search = search;

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

export async function updateConfig(token: string, updates: { allow_public_signup?: boolean, require_whitelist?: boolean }) {
  const query = new URLSearchParams();
  if (updates.allow_public_signup !== undefined) query.append('allow_public_signup', updates.allow_public_signup.toString());
  if (updates.require_whitelist !== undefined) query.append('require_whitelist', updates.require_whitelist.toString());

  const response = await fetch(`${API_BASE_URL}/config?${query}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
}

export async function fetchWhitelist(token: string) {
  const response = await fetch(`${API_BASE_URL}/whitelist`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function addToWhitelist(token: string, email: string) {
  const response = await fetch(`${API_BASE_URL}/whitelist?email=${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function removeFromWhitelist(token: string, email: string) {
  const response = await fetch(`${API_BASE_URL}/whitelist/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function fetchCurrentUser(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch user profile from database');
  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

export async function fetchStaff(token: string) {
  const response = await fetch(`${API_BASE_URL}/staff`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch staff');
  return response.json();
}

export async function updateUserRole(token: string, userId: string, role: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Failed to update user role');
  }
  return response.json();
}
