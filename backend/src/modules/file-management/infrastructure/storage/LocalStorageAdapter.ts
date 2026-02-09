/**
 * LocalStorageAdapter
 * Local filesystem storage adapter — implements IStorageAdapter
 */
import fs from 'fs';
import path from 'path';
import type { IStorageAdapter } from '../../domain/ports/IStorageAdapter.js';

export class LocalStorageAdapter implements IStorageAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
    this.ensureBaseDirectory();
  }

  private ensureBaseDirectory(): void {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  private getFullPath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.basePath, sanitizedKey);
  }

  private ensureDirectoryForKey(key: string): void {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  getName(): 'local' | 's3' {
    return 'local';
  }

  async store(buffer: Buffer, key: string, _mimeType: string): Promise<string> {
    this.ensureDirectoryForKey(key);
    const fullPath = this.getFullPath(key);
    await fs.promises.writeFile(fullPath, buffer);
    return key;
  }

  async retrieve(key: string): Promise<Buffer | null> {
    const fullPath = this.getFullPath(key);
    try {
      const buffer = await fs.promises.readFile(fullPath);
      return buffer;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async createReadStream(key: string): Promise<NodeJS.ReadableStream | null> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.promises.access(fullPath);
      return fs.createReadStream(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.promises.unlink(fullPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.promises.access(fullPath);
      return true;
    } catch (err) {
      return false;
    }
  }
}
