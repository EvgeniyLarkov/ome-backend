export const SOCKET_SERVICE_EVENTS = {
  on_connect: 'on-connect',
} as const;

type SOCKET_SERVICE_EVENTS_KEYS = keyof typeof SOCKET_SERVICE_EVENTS;
export type socketServiceEvents =
  typeof SOCKET_SERVICE_EVENTS[SOCKET_SERVICE_EVENTS_KEYS];

export type onConnectedResponseDTO = {
  result: boolean;
  anonId?: string;
};
