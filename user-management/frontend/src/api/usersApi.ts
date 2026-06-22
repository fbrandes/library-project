import type { CreateUserRequest, ErrorResponse, UpdateUserRequest, User } from '../generated/userModels';

export type Fetcher = typeof fetch;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly details: ErrorResponse,
  ) {
    super(details.problems?.length ? `${details.message}: ${details.problems.join('; ')}` : details.message);
    this.name = 'ApiError';
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (text.trim() === '') {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function request<T>(fetcher: Fetcher, url: string, init: RequestInit): Promise<T> {
  const response = await fetcher(url, init);
  const body = await parseJson<T | ErrorResponse>(response);

  if (!response.ok) {
    const details =
      body && typeof body === 'object' && 'message' in body
        ? (body as ErrorResponse)
        : { message: `Request failed with status ${response.status}` };
    throw new ApiError(response.status, details);
  }

  return body as T;
}

export function createUsersApi(baseUrl = '/api', fetcher: Fetcher = fetch) {
  const userUrl = (id?: string) => `${baseUrl}/users${id ? `/${encodeURIComponent(id)}` : ''}`;
  const jsonHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  return {
    createUser(input: CreateUserRequest): Promise<User> {
      return request<User>(fetcher, userUrl(), {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(input),
      });
    },

    getUser(id: string): Promise<User> {
      return request<User>(fetcher, userUrl(id), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    },

    updateUser(id: string, input: UpdateUserRequest): Promise<User> {
      return request<User>(fetcher, userUrl(id), {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(input),
      });
    },

    async deleteUser(id: string): Promise<void> {
      await request<void>(fetcher, userUrl(id), {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
    },
  };
}

export type UsersApi = ReturnType<typeof createUsersApi>;
