/**
 * IP Address Utilities
 * Centralized IP extraction with security considerations for proxy environments.
 *
 * IMPORTANT: This utility assumes that Express is configured with appropriate
 * `trust proxy` settings. See:
 * - https://expressjs.com/en/guide/behind-proxies.html
 *
 * For production behind a reverse proxy (nginx, load balancer, etc.):
 * - Set `app.set('trust proxy', 1)` for a single hop
 * - Or `app.set('trust proxy', 'loopback, linklocal, uniquelocal')` for trusted ranges
 *
 * Without proper trust proxy configuration, the `X-Forwarded-For` header can be
 * spoofed by malicious clients.
 */

import type { Request } from 'express';

/**
 * Extract client IP address from request.
 *
 * Uses req.ip which respects Express trust proxy settings.
 * Falls back to socket remote address if req.ip is unavailable.
 *
 * @param req - Express request object
 * @returns Client IP address or 'unknown' if not determinable
 */
export function getClientIp(req: Request): string {
  // req.ip respects Express trust proxy settings and handles X-Forwarded-For
  // appropriately based on the configured trust level
  if (req.ip) {
    return req.ip;
  }

  // Fallback to socket address (direct connection with no proxy)
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return 'unknown';
}

/**
 * Check if IP address appears to be local/internal.
 * Useful for security auditing and logging.
 */
export function isLocalIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}
