/**
 * HTTP Client Usage Examples
 * 
 * This file demonstrates how to use the HTTP Client in various scenarios.
 * These examples can be used as reference or copied into actual implementation.
 */

import { container } from '../../../core';
import { IHttpClient, HttpError, HttpTimeoutError, HttpNetworkError } from './index';

/**
 * Example 1: Basic GET request
 */
export async function exampleBasicGet() {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  try {
    const response = await httpClient.get('https://api.example.com/data');
    console.log('Data:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

/**
 * Example 2: POST request with body
 */
export async function examplePost() {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  const requestBody = {
    name: 'Test Device',
    type: 'mobile',
  };
  
  try {
    const response = await httpClient.post(
      'https://api.example.com/devices',
      requestBody
    );
    console.log('Created device:', response.data);
  } catch (error) {
    console.error('Failed to create device:', error);
  }
}

/**
 * Example 3: Request with custom headers and timeout
 */
export async function exampleCustomOptions() {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  try {
    const response = await httpClient.get('https://api.example.com/protected', {
      headers: {
        'Authorization': 'Bearer your-token-here',
        'X-API-Version': '1.0',
      },
      timeout: 10000, // 10 seconds
      retries: 5,
      retryDelay: 2000, // 2 seconds
    });
    console.log('Protected data:', response.data);
  } catch (error) {
    console.error('Failed to fetch protected data:', error);
  }
}

/**
 * Example 4: Comprehensive error handling
 */
export async function exampleErrorHandling() {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  try {
    const response = await httpClient.get('https://api.example.com/data');
    return response.data;
  } catch (error) {
    if (error instanceof HttpTimeoutError) {
      console.error('Request timed out. Please check your connection.');
      // Show timeout message to user
    } else if (error instanceof HttpNetworkError) {
      console.error('Network error. Please check your internet connection.');
      // Show network error message to user
    } else if (error instanceof HttpError) {
      if (error.status === 401) {
        console.error('Unauthorized. Please login again.');
        // Redirect to login
      } else if (error.status === 404) {
        console.error('Resource not found.');
        // Show not found message
      } else if (error.status && error.status >= 500) {
        console.error('Server error. Please try again later.');
        // Show server error message
      } else {
        console.error(`HTTP error ${error.status}:`, error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
}

/**
 * Example 5: Headscale device registration
 */
export async function exampleHeadscaleRegistration(
  headscaleUrl: string,
  preAuthKey: string,
  deviceName: string
) {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  try {
    // Register device with Headscale
    const response = await httpClient.post(
      `${headscaleUrl}/api/v1/device/register`,
      {
        key: preAuthKey,
        name: deviceName,
      },
      {
        timeout: 15000, // 15 seconds for registration
        retries: 3,
      }
    );
    
    console.log('Device registered:', response.data);
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 400) {
      console.error('Invalid pre-auth key or device name');
    } else if (error instanceof HttpTimeoutError) {
      console.error('Registration timeout. Headscale server may be unreachable.');
    }
    throw error;
  }
}

/**
 * Example 6: Fetch WireGuard configuration
 */
export async function exampleFetchWireGuardConfig(
  headscaleUrl: string,
  deviceId: string
) {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  try {
    const response = await httpClient.get(
      `${headscaleUrl}/api/v1/device/${deviceId}/config`,
      {
        timeout: 10000,
        retries: 2,
      }
    );
    
    console.log('WireGuard config received');
    return response.data.config; // INI format string
  } catch (error) {
    console.error('Failed to fetch WireGuard config:', error);
    throw error;
  }
}

/**
 * Example 7: Parallel requests
 */
export async function exampleParallelRequests() {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  try {
    const [devices, users, config] = await Promise.all([
      httpClient.get('https://api.example.com/devices'),
      httpClient.get('https://api.example.com/users'),
      httpClient.get('https://api.example.com/config'),
    ]);
    
    console.log('All data fetched:', {
      devices: devices.data,
      users: users.data,
      config: config.data,
    });
  } catch (error) {
    console.error('One or more requests failed:', error);
  }
}

/**
 * Example 8: Request with retry on specific error
 */
export async function exampleRetryOnSpecificError() {
  const httpClient = container.resolve<IHttpClient>('IHttpClient');
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const response = await httpClient.get('https://api.example.com/data', {
        retries: 0, // Handle retries manually
      });
      return response.data;
    } catch (error) {
      attempts++;
      
      if (error instanceof HttpError && error.status === 503) {
        // Service unavailable, retry
        console.log(`Service unavailable, retry ${attempts}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      } else {
        // Other errors, don't retry
        throw error;
      }
    }
  }
  
  throw new Error('Max retry attempts reached');
}
