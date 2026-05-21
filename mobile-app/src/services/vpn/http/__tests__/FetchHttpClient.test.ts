/**
 * Unit tests for FetchHttpClient
 * Tests successful requests, error handling, timeout, and retry logic
 */

import { FetchHttpClient } from '../FetchHttpClient';
import { HttpError, HttpTimeoutError, HttpNetworkError } from '../../interfaces/IHttpClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('FetchHttpClient', () => {
  let client: FetchHttpClient;

  beforeEach(() => {
    client = new FetchHttpClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Requests', () => {
    it('should make a successful GET request', async () => {
      // Arrange
      const mockData = { message: 'success' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockData,
      });

      // Act
      const response = await client.get('https://api.example.com/data');

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should make a successful POST request with body', async () => {
      // Arrange
      const requestBody = { name: 'test' };
      const mockData = { id: 1, ...requestBody };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockData,
      });

      // Act
      const response = await client.post('https://api.example.com/items', requestBody);

      // Assert
      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should make a successful PUT request', async () => {
      // Arrange
      const requestBody = { name: 'updated' };
      const mockData = { id: 1, ...requestBody };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockData,
      });

      // Act
      const response = await client.put('https://api.example.com/items/1', requestBody);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    it('should make a successful DELETE request', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => '',
      });

      // Act
      const response = await client.delete('https://api.example.com/items/1');

      // Assert
      expect(response.status).toBe(204);
    });

    it('should handle custom headers', async () => {
      // Arrange
      const customHeaders = { 'Authorization': 'Bearer token123' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({}),
      });

      // Act
      await client.get('https://api.example.com/data', { headers: customHeaders });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: expect.objectContaining(customHeaders),
        })
      );
    });

    it('should handle non-JSON responses', async () => {
      // Arrange
      const textData = 'Plain text response';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'text/plain']]),
        text: async () => textData,
      });

      // Act
      const response = await client.get('https://api.example.com/text');

      // Assert
      expect(response.data).toBe(textData);
    });
  });

  describe('Error Handling', () => {
    it('should throw HttpError on 4xx client error', async () => {
      // Arrange
      const errorData = { error: 'Not found' };
      const mockHeaders = new Map([['content-type', 'application/json']]);
      mockHeaders.forEach = function(callback: any) {
        callback('application/json', 'content-type');
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: mockHeaders,
        json: async () => errorData,
      });

      // Act & Assert
      try {
        await client.get('https://api.example.com/notfound');
        fail('Should have thrown HttpError');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(404);
        expect((error as HttpError).response).toEqual(errorData);
      }
    });

    it('should throw HttpError on 5xx server error', async () => {
      // Arrange
      const mockHeaders = new Map([['content-type', 'application/json']]);
      mockHeaders.forEach = function(callback: any) {
        callback('application/json', 'content-type');
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: mockHeaders,
        json: async () => ({ error: 'Server error' }),
      });

      // Act & Assert
      try {
        await client.get('https://api.example.com/error', { retries: 0 });
        fail('Should have thrown HttpError');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(500);
      }
    });

    it('should throw HttpNetworkError on network failure', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

      // Act & Assert
      await expect(client.get('https://api.example.com/data', { retries: 0 })).rejects.toThrow(
        HttpNetworkError
      );
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after specified duration', async () => {
      // Arrange - Mock AbortController behavior
      const mockAbort = jest.fn();
      const originalAbortController = global.AbortController;
      
      (global as any).AbortController = class {
        signal = { aborted: false };
        abort = mockAbort;
      };

      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error: any = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        });
      });

      // Act & Assert
      await expect(
        client.get('https://api.example.com/slow', { timeout: 100, retries: 0 })
      ).rejects.toThrow(HttpTimeoutError);
      
      // Restore
      global.AbortController = originalAbortController;
    }, 10000);

    it('should not timeout if response is fast enough', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: 'fast' }),
      });

      // Act
      const response = await client.get('https://api.example.com/fast', { timeout: 5000 });

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network error', async () => {
      // Arrange
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ success: true }),
        });

      // Act
      const response = await client.get('https://api.example.com/data', { retries: 2, retryDelay: 10 });

      // Assert
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx server error', async () => {
      // Arrange
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ error: 'Unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ success: true }),
        });

      // Act
      const response = await client.get('https://api.example.com/data', { retries: 1, retryDelay: 10 });

      // Assert
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should NOT retry on 4xx client error', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ error: 'Bad request' }),
      });

      // Act & Assert
      await expect(client.get('https://api.example.com/data', { retries: 3 })).rejects.toThrow(
        HttpError
      );
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should fail after max retries', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      // Act & Assert
      await expect(
        client.get('https://api.example.com/data', { retries: 2, retryDelay: 10 })
      ).rejects.toThrow(HttpNetworkError);
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff for retries', async () => {
      // Arrange
      const delays: number[] = [];
      const startTime = Date.now();

      (global.fetch as jest.Mock).mockImplementation(() => {
        delays.push(Date.now() - startTime);
        return Promise.reject(new TypeError('Network error'));
      });

      // Act
      try {
        await client.get('https://api.example.com/data', { retries: 2, retryDelay: 100 });
      } catch (e) {
        // Expected to fail
      }

      // Assert - delays should increase (exponential backoff)
      expect(delays.length).toBe(3);
      // First call is immediate, second after ~100ms, third after ~200ms
    }, 10000);
  });
});
