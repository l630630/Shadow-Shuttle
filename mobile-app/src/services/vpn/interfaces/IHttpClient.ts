/**
 * HTTP Client Interface
 * 
 * Abstraction for HTTP requests with timeout and retry support.
 * Allows for easy mocking in tests and potential implementation swapping.
 */

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number; // milliseconds
  retries?: number; // number of retry attempts
  retryDelay?: number; // milliseconds between retries
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class HttpTimeoutError extends HttpError {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'HttpTimeoutError';
  }
}

export class HttpNetworkError extends HttpError {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'HttpNetworkError';
  }
}

export interface IHttpClient {
  /**
   * Send a GET request
   */
  get<T = any>(url: string, options?: Partial<HttpRequestOptions>): Promise<HttpResponse<T>>;

  /**
   * Send a POST request
   */
  post<T = any>(url: string, body?: any, options?: Partial<HttpRequestOptions>): Promise<HttpResponse<T>>;

  /**
   * Send a PUT request
   */
  put<T = any>(url: string, body?: any, options?: Partial<HttpRequestOptions>): Promise<HttpResponse<T>>;

  /**
   * Send a DELETE request
   */
  delete<T = any>(url: string, options?: Partial<HttpRequestOptions>): Promise<HttpResponse<T>>;

  /**
   * Send a generic HTTP request
   */
  request<T = any>(url: string, options: HttpRequestOptions): Promise<HttpResponse<T>>;
}
