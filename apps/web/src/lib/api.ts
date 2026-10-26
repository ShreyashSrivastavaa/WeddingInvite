export class ApiError extends Error {
  code: string;
  fieldErrors?: Record<string, string[]>;
  status: number;

  constructor(status: number, message: string, code = 'ERROR', fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include X-Requested-With for CSRF verification
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // send and receive session cookie
  });

  // Handle file downloads
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    if (!response.ok) {
      throw new ApiError(response.status, 'Export failed', 'EXPORT_ERROR');
    }
    const blob = await response.blob();
    return blob as unknown as T;
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const errorInfo = data?.error || {};
    throw new ApiError(
      response.status,
      errorInfo.message || `Request failed with status ${response.status}`,
      errorInfo.code || 'REQUEST_FAILED',
      errorInfo.fieldErrors
    );
  }

  return data as T;
}

export async function fetchPublicInvitation(token: string): Promise<any> {
  return apiFetch(`/api/rsvp/${token}`);
}

export async function submitPublicRsvp(token: string, payload: any): Promise<any> {
  return apiFetch(`/api/rsvp/${token}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function optOutGuestReminders(token: string): Promise<any> {
  return apiFetch(`/api/rsvp/${token}/opt-out`, {
    method: 'POST',
  });
}
