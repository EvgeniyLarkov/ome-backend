export const MAP_PARTICIPANT_TYPE = {
  viewer: 0,
  editor: 10,
  moderator: 20,
  admin: 30,
  creator: 40,
} as const;

type MAP_PARTICIPANT_TYPE_KEYS = keyof typeof MAP_PARTICIPANT_TYPE;
export type mapParticipantTypes =
  typeof MAP_PARTICIPANT_TYPE[MAP_PARTICIPANT_TYPE_KEYS];

export const MAP_PARTICIPANT_STATUS = {
  default: 0,
  banned: -1,
} as const;

type MAP_PARTICIPANT_STATUS_KEYS = keyof typeof MAP_PARTICIPANT_STATUS;
export type mapParticipantStatuses =
  typeof MAP_PARTICIPANT_STATUS[MAP_PARTICIPANT_STATUS_KEYS];
