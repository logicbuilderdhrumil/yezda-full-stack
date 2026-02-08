/**
 * Socket Service Port (Chat)
 *
 * Abstraction for real-time message broadcasting.
 */
export interface ISocketService {
  emitToUser(userId: string, event: string, payload: unknown): void;
}
