/**
 * Fetch-based HTTP Client Implementation
 * 
 * Implements IHttpClient using the Fetch API with timeout and retry support.
 */

import {
  IHttpClient,
  HttpRequestOptions,
  HttpResponse,
  HttpError,
  HttpTimeoutError,
  HttpNetworkError,
} from '../interfaces/IHttpClient';

export class FetchHttpClient implements IHttpClient {
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 3;
  private defaultRetryDelay = 1000; // 1 second

  async get<T = any>(
    url: string,
    options?: Partial<HttpRequestOptions>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'GET',
      ...options,
    });
  }

  async post<T = any>(
    url: string,
    body?: any,
    options?: Partial<HttpRequestOptions>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body,
      ...options,
    });
  }

  async put<T = any>(
    url: string,
    body?: any,
    options?: Partial<HttpRequestOptions>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body,
      ...options,
    });
  }

  async delete<T = any>(
    url: string,
    options?: Partial<HttpRequestOptions>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'DELETE',
      ...options,
    });
  }

  async request<T = any>(
    url: string,
    options: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const timeout = options.timeout ?? this.defaultTimeout;
    const retries = options.retries ?? this.defaultRetries;
    const retryDelay = options.retryDelay ?? this.defaultRetryDelay;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.executeRequest<T>(url, options, timeout);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof HttpError && error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          throw error;
        }

        // Wait before retrying
        await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
      }
    }

    throw lastError || new HttpError('Request failed after retries');
  }

  private async executeRequest<T>(
    url: string,
    options: HttpRequestOptions,
    timeout: number
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const fetchOptions: RequestInit = {
        method: options.method,
        headers,
        signal: controller.signal,
      };

      if (options.body) {
        fetchOptions.body = typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      // Check for HTTP errors
      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }

      // Convert Headers to plain object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof HttpError) {
        throw error;
      }

      // Handle abort (timeout)
      if ((error as any).name === 'AbortError') {
        throw new HttpTimeoutError(`Request timeout after ${timeout}ms`);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new HttpNetworkError(`Network error: ${error.message}`);
      }

      throw new HttpError(`Request failed: ${(error as Error).message}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
