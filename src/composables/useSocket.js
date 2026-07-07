import { io } from 'socket.io-client';
import { onBeforeUnmount } from 'vue';

/**
 * Connects to a Socket.IO namespace of the explorer backend and tears the
 * connection down when the owning component unmounts.
 *
 * The explorer exposes four namespaces: `/header`, `/delegateMonitor`,
 * `/networkMonitor`, and `/activityGraph`. Each emits `data` events with
 * page-specific payloads. On unmount the composable emits
 * `forceDisconnect` (the backend uses it to stop its emit intervals
 * immediately instead of waiting for the transport timeout) and closes
 * the socket.
 *
 * Must be called during component setup, otherwise the unmount hook
 * cannot be registered.
 *
 * @param {string} namespace Namespace path starting with `/`, for example `/networkMonitor`
 * @returns {import('socket.io-client').Socket} Connected socket instance
 */
export function useSocket(namespace) {
  const socket = io(namespace, { forceNew: true });

  onBeforeUnmount(() => {
    socket.emit('forceDisconnect');
    socket.removeAllListeners();
    socket.disconnect();
  });

  return socket;
}
