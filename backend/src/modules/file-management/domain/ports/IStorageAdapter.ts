/**
 * Storage adapter port — defines contract for pluggable storage backends
 */
export interface IStorageAdapter {
  /** Store a file and return the storage key */
  store(buffer: Buffer, key: string, mimeType: string): Promise<string>;

  /** Retrieve a file by storage key */
  retrieve(key: string): Promise<Buffer | null>;

  /** Create a readable stream for a file */
  createReadStream(key: string): Promise<NodeJS.ReadableStream | null>;

  /** Delete a file by storage key */
  delete(key: string): Promise<boolean>;

  /** Check if a file exists */
  exists(key: string): Promise<boolean>;

  /** Get the adapter name */
  getName(): 'local' | 's3';
}
