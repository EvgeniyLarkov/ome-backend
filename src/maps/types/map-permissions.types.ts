export const MAP_EDIT_PERMISSIONS = {
  all: 0,
  creator: 1,
  logined: 2,
  creator_and_moderators: 3,
  allowed_users: 4,
} as const;

type MAP_EDIT_PERMISSIONS_KEYS = keyof typeof MAP_EDIT_PERMISSIONS;
export type mapsEditPermissions =
  typeof MAP_EDIT_PERMISSIONS[MAP_EDIT_PERMISSIONS_KEYS];
