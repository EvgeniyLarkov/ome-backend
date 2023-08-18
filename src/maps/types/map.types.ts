export const MAP_EVENTS = {
  new_action: 'new_action',
  join_map: 'join_map',
  participant_join: 'participant_join',
  participant_leave: 'participant_leave',
  leave_map: 'leave_map',
  get_actions: 'get_map_actions',
  drop_action: 'drop_action',
  change_action: 'change_action',
} as const;

type MAP_EVENTS_KEYS = keyof typeof MAP_EVENTS;
export type mapsActionNames = typeof MAP_EVENTS[MAP_EVENTS_KEYS];

export const MAP_ACTION_TYPES = {
  initial_position: 0,
  marker: 1,
} as const;

type MAP_ACTION_TYPES_KEYS = keyof typeof MAP_ACTION_TYPES;
export type mapActionTypes = typeof MAP_ACTION_TYPES[MAP_ACTION_TYPES_KEYS];

export const MAP_STATUSES = {
  default: 0,
  deleted: -1,
} as const;

type MAP_STATUSES_KEYS = keyof typeof MAP_STATUSES;
export type mapStatuses = typeof MAP_STATUSES[MAP_STATUSES_KEYS];

// export type InitialPositionEvent = {
//   type: mapEventsTypes['SET_INITIAL_POSITION'];
// };
