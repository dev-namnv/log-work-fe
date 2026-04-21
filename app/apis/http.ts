import { getToken } from '~/lib/token';
import type { ApiError } from '~/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE_URL =
	typeof process !== 'undefined'
		? (process.env.API_BASE_URL ?? 'http://localhost:3000')
		: (import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:3000');

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiException extends Error {
	constructor(
		public readonly statusCode: number,
		message: string,
		public readonly error?: string,
	) {
		super(message);
		this.name = 'ApiException';
	}

	static fromResponse(err: ApiError): ApiException {
		return new ApiException(err.statusCode, err.message, err.error);
	}
}

// ---------------------------------------------------------------------------
// Request options — extends standard RequestInit
// ---------------------------------------------------------------------------

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
	/** Query-string params appended to the URL */
	params?: Record<string, string | number | boolean | undefined | null>;
	/** Automatically serialise as JSON body (skip for FormData/URLSearchParams) */
	json?: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUrl(path: string, params?: RequestOptions['params']): string {
	const url = new URL(path, API_BASE_URL);
	if (params) {
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) {
				url.searchParams.set(k, String(v));
			}
		});
	}
	return url.toString();
}

async function parseResponse<T>(res: Response): Promise<T> {
	// Some endpoints return plain text (e.g. "Cache was clear!")
	const contentType = res.headers.get('content-type') ?? '';
	const isJson = contentType.includes('application/json');

	if (!res.ok) {
		if (isJson) {
			const err: ApiError = await res.json();
			throw ApiException.fromResponse(err);
		}
		throw new ApiException(res.status, res.statusText);
	}

	if (res.status === 204 || res.headers.get('content-length') === '0') {
		return undefined as T;
	}

	return isJson
		? (res.json() as Promise<T>)
		: (res.text() as unknown as Promise<T>);
}

// ---------------------------------------------------------------------------
// Core HTTP client
// ---------------------------------------------------------------------------

async function request<T>(
	method: string,
	path: string,
	{ params, json, headers: extraHeaders, ...rest }: RequestOptions = {},
): Promise<T> {
	const url = buildUrl(path, params);

	const headers: Record<string, string> = {};
	if (json !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	const token = getToken();
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	if (extraHeaders) {
		Object.assign(headers, extraHeaders);
	}

	const res = await fetch(url, {
		method,
		headers,
		body: json !== undefined ? JSON.stringify(json) : undefined,
		...rest,
	});

	if (
		res.status === 401 &&
		!['/auth/login', '/auth/logout'].includes(window.location.pathname)
	) {
		// Optional: auto-logout on 401 Unauthorized
		window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
	}

	return parseResponse<T>(res);
}

// ---------------------------------------------------------------------------
// Public API — exported http helper (thin wrapper around `request`)
// ---------------------------------------------------------------------------

export const http = {
	get: <T>(path: string, options?: RequestOptions) =>
		request<T>('GET', path, options),

	post: <T>(path: string, options?: RequestOptions) =>
		request<T>('POST', path, options),

	put: <T>(path: string, options?: RequestOptions) =>
		request<T>('PUT', path, options),

	patch: <T>(path: string, options?: RequestOptions) =>
		request<T>('PATCH', path, options),

	delete: <T>(path: string, options?: RequestOptions) =>
		request<T>('DELETE', path, options),
};
