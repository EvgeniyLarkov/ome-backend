export const MAP_EVENTS = {
  new_action: 'new_action',
  join_map: 'join-map',
  leave_map: 'leave-map',
  get_actions: 'get-map-actions',
  drop_action: 'drop_action',
} as const;

type MAP_EVENTS_KEYS = keyof typeof MAP_EVENTS;
export type mapsActionNames = typeof MAP_EVENTS[MAP_EVENTS_KEYS];

export const MAP_ACTION_TYPES = {
  initial_position: 0,
  marker: 1,
} as const;

type MAP_ACTION_TYPES_KEYS = keyof typeof MAP_ACTION_TYPES;
export type mapActionTypes = typeof MAP_ACTION_TYPES[MAP_ACTION_TYPES_KEYS];

// export type InitialPositionEvent = {
//   type: mapEventsTypes['SET_INITIAL_POSITION'];
// };
