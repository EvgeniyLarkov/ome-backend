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

export type ParticipantMapPermissions = {
  view: boolean;
  edit_actions: boolean;
  drop_actions: boolean;
  add_actions: boolean;
  ban_participants: boolean;
  invite_participants: boolean;
  modify_participants: boolean;
  set_permissions: boolean;
  change_map_description: boolean;
  change_map_properties: boolean;
};
