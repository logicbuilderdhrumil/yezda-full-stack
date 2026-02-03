/**
 * API Client Integration Tests
 * Tests with real HTTP server to verify actual request behavior
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import {
  ApiClient,
  createApiClient,
  maskUrlSecrets,
  isPrivateIP,
  type ApiClientConfig,
  type OutboundSecurityConfig,
} from '../src/services/api-client.service.js';

describe('ApiClient Integration Tests', () => {
  let server: Server;
  let serverPort: number;
  let baseUrl: string;

  // Track requests for verification
  const receivedRequests: Array<{
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    body: string;
  }> = [];

  beforeAll(async () => {
    // Create a real HTTP test server
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        receivedRequests.push({
          method: req.method ?? 'GET',
          url: req.url ?? '/',
          headers: req.headers,
          body,
        });

        // Route handling
        const url = req.url ?? '/';

        // Slow endpoint for timeout testing
        if (url.startsWith('/slow')) {
          const delayMs = parseInt(url.split('/')[2] ?? '1000', 10);
          setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ delayed: true, delayMs }));
          }, delayMs);
          return;
        }

        // Error endpoints
        if (url.startsWith('/error/')) {
          const statusCode = parseInt(url.split('/')[2] ?? '500', 10);
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Error ${statusCode}` }));
          return;
        }

        // Echo endpoint
        if (url.startsWith('/echo')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: body ? JSON.parse(body) : null,
          }));
          return;
        }

        // Headers test endpoint
        if (url.startsWith('/headers')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ receivedHeaders: req.headers }));
          return;
        }

        // GET users endpoint
        if (url === '/users' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify([{ id: 1, name: 'Test User' }]));
          return;
        }

        // POST users endpoint
        if (url === '/users' && req.method === 'POST') {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          const userData = body ? JSON.parse(body) : {};
          res.end(JSON.stringify({ id: 2, ...userData }));
          return;
        }

        // Default response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: url }));
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        serverPort = addr.port;
        // Use IP directly to bypass TLS requirement for local testing
        baseUrl = `http://127.0.0.1:${serverPort}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  const createTestClient = (
    overrides?: Partial<ApiClientConfig>,
    securityOverrides?: Partial<OutboundSecurityConfig>
  ): ApiClient => {
    return createApiClient(
      {
        baseUrl,
        timeoutMs: 5000,
        integrationName: 'integration-test',
        retry: {
          maxAttempts: 1,
          baseDelayMs: 10,
          maxDelayMs: 50,
          retryableStatuses: [500, 502, 503],
          exponentialBackoff: false,
        },
        ...overrides,
      },
      {
        // Disable security checks for integration tests with local server
        allowAllHttps: true,
        requireTls: false, // HTTP for local testing
        blockPrivateRanges: false, // Allow localhost
        allowedHosts: [],
        ...securityOverrides,
      }
    );
  };

  describe('Real HTTP Requests', () => {
    it('should make actual GET request and receive response', async () => {
      const client = createTestClient();
      const initialCount = receivedRequests.length;

      const response = await client.get<Array<{ id: number; name: string }>>('/users');

      expect(response.status).toBe(200);
      expect(response.data).toEqual([{ id: 1, name: 'Test User' }]);
      expect(response.durationMs).toBeGreaterThan(0);
      expect(receivedRequests.length).toBe(initialCount + 1);
    });

    it('should make actual POST request with body', async () => {
      const client = createTestClient();
      const requestBody = { name: 'New User', email: 'test@example.com' };

      const response = await client.post<{ id: number; name: string; email: string }>(
        '/users',
        requestBody
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({ id: 2, ...requestBody });
    });

    it('should include custom headers in actual request', async () => {
      const client = createTestClient({
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      await client.get('/headers');

      const lastRequest = receivedRequests[receivedRequests.length - 1];
      expect(lastRequest.headers['x-custom-header']).toBe('custom-value');
      expect(lastRequest.headers['x-request-id']).toBeDefined();
    });

    it('should handle query parameters correctly', async () => {
      const client = createTestClient();

      await client.get('/echo', { page: 1, limit: 10, active: true });

      const lastRequest = receivedRequests[receivedRequests.length - 1];
      expect(lastRequest.url).toContain('page=1');
      expect(lastRequest.url).toContain('limit=10');
      expect(lastRequest.url).toContain('active=true');
    });
  });

  describe('Real Timeout Behavior', () => {
    it('should timeout on slow responses', async () => {
      const client = createTestClient({ timeoutMs: 50 }); // 50ms timeout

      // Request that takes 200ms
      await expect(client.get('/slow/200')).rejects.toMatchObject({
        code: 'TIMEOUT',
      });
    });

    it('should succeed when response is within timeout', async () => {
      const client = createTestClient({ timeoutMs: 500 }); // 500ms timeout

      // Request that takes 50ms
      const response = await client.get<{ delayed: boolean }>('/slow/50');

      expect(response.status).toBe(200);
      expect(response.data.delayed).toBe(true);
    });
  });

  describe('Real Error Handling', () => {
    it('should handle 4xx errors from real server', async () => {
      const client = createTestClient();

      await expect(client.get('/error/404')).rejects.toMatchObject({
        code: 'CLIENT_ERROR',
        status: 404,
      });
    });

    it('should handle 5xx errors from real server', async () => {
      const client = createTestClient();

      await expect(client.get('/error/500')).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        status: 500,
      });
    });
  });

  describe('Request/Response Round-Trip', () => {
    it('should correctly round-trip JSON data', async () => {
      const client = createTestClient();
      const testData = {
        string: 'hello',
        number: 42,
        boolean: true,
        nested: { key: 'value' },
        array: [1, 2, 3],
      };

      const response = await client.post<{
        method: string;
        body: typeof testData;
      }>('/echo', testData);

      expect(response.status).toBe(200);
      expect(response.data.method).toBe('POST');
      expect(response.data.body).toEqual(testData);
    });
  });
});

describe('DNS Rebinding Protection', () => {
  describe('isPrivateIP', () => {
    it('should identify private IPv4 ranges', () => {
      // 10.x.x.x
      expect(isPrivateIP('10.0.0.1')).toBe(true);
      expect(isPrivateIP('10.255.255.255')).toBe(true);

      // 172.16.x.x - 172.31.x.x
      expect(isPrivateIP('172.16.0.1')).toBe(true);
      expect(isPrivateIP('172.31.255.255')).toBe(true);
      expect(isPrivateIP('172.15.0.1')).toBe(false);
      expect(isPrivateIP('172.32.0.1')).toBe(false);

      // 192.168.x.x
      expect(isPrivateIP('192.168.0.1')).toBe(true);
      expect(isPrivateIP('192.168.255.255')).toBe(true);

      // Loopback
      expect(isPrivateIP('127.0.0.1')).toBe(true);
      expect(isPrivateIP('127.255.255.255')).toBe(true);

      // 0.x.x.x
      expect(isPrivateIP('0.0.0.0')).toBe(true);
    });

    it('should identify localhost', () => {
      expect(isPrivateIP('localhost')).toBe(true);
      expect(isPrivateIP('LOCALHOST')).toBe(true);
    });

    it('should identify private IPv6 addresses', () => {
      expect(isPrivateIP('::1')).toBe(true);
      expect(isPrivateIP('fe80::1')).toBe(true);
    });

    it('should identify IPv4-mapped IPv6 addresses', () => {
      expect(isPrivateIP('::ffff:127.0.0.1')).toBe(true);
      expect(isPrivateIP('::ffff:192.168.1.1')).toBe(true);
      expect(isPrivateIP('::ffff:10.0.0.1')).toBe(true);
    });

    it('should allow public IP addresses', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false);
      expect(isPrivateIP('1.1.1.1')).toBe(false);
      expect(isPrivateIP('203.0.113.1')).toBe(false);
    });
  });
});

describe('URL Secret Masking', () => {
  describe('maskUrlSecrets', () => {
    it('should mask api_key parameter', () => {
      const url = 'https://api.example.com/endpoint?api_key=supersecretkey123';
      const masked = maskUrlSecrets(url);

      expect(masked).not.toContain('supersecretkey123');
      expect(masked).toContain('api_key=su****23');
    });

    it('should mask token parameter', () => {
      const url = 'https://api.example.com/endpoint?token=myauthtoken456';
      const masked = maskUrlSecrets(url);

      expect(masked).not.toContain('myauthtoken456');
      expect(masked).toContain('token=');
    });

    it('should mask access_token parameter', () => {
      const url = 'https://api.example.com/oauth?access_token=bearer_token_here';
      const masked = maskUrlSecrets(url);

      expect(masked).not.toContain('bearer_token_here');
    });

    it('should mask secret parameter', () => {
      const url = 'https://api.example.com/webhook?secret=webhook_secret_123';
      const masked = maskUrlSecrets(url);

      expect(masked).not.toContain('webhook_secret_123');
    });

    it('should mask short secrets completely', () => {
      const url = 'https://api.example.com/endpoint?api_key=short';
      const masked = maskUrlSecrets(url);

      expect(masked).toContain('api_key=****');
      expect(masked).not.toContain('short');
    });

    it('should preserve non-sensitive parameters', () => {
      const url = 'https://api.example.com/users?page=1&limit=10&api_key=secretkey123';
      const masked = maskUrlSecrets(url);

      expect(masked).toContain('page=1');
      expect(masked).toContain('limit=10');
      expect(masked).not.toContain('secretkey123');
    });

    it('should handle multiple sensitive parameters', () => {
      const url = 'https://api.example.com/endpoint?api_key=key123456789&token=tok123456789';
      const masked = maskUrlSecrets(url);

      expect(masked).not.toContain('key123456789');
      expect(masked).not.toContain('tok123456789');
    });

    it('should return original URL when no sensitive params', () => {
      const url = 'https://api.example.com/users?page=1&limit=10';
      const masked = maskUrlSecrets(url);

      expect(masked).toBe(url);
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidUrl = 'not-a-valid-url';
      const masked = maskUrlSecrets(invalidUrl);

      expect(masked).toBe(invalidUrl);
    });

    it('should handle URLs without query parameters', () => {
      const url = 'https://api.example.com/users/123';
      const masked = maskUrlSecrets(url);

      expect(masked).toBe(url);
    });

    it('should be case-insensitive for parameter names', () => {
      const url = 'https://api.example.com/endpoint?API_KEY=secret123456&TOKEN=token123456';
      const masked = maskUrlSecrets(url);

      expect(masked).not.toContain('secret123456');
      expect(masked).not.toContain('token123456');
    });
  });
});
