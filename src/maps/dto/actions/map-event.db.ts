import { mapActionTypes } from '../../types/map.types';

export class MapActionDB {
  hash?: string;
  type: mapActionTypes;
  status: number;
  lat: number | null;
  lng: number | null;
  data?: Record<string, unknown>;
  creatorHash: string;
  mapHash: string;
  version?: number;
  deletedAt?: Date;
  createdAt?: Date;
}
