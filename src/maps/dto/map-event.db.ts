import { mapActionTypes } from '../types/map.types';

export class MapEventDB {
  hash?: string;
  type: mapActionTypes;
  status: number;
  lat: number | null;
  lng: number | null;
  data?: Record<string, unknown>;
  creatorHash: string;
  mapHash: string;
  version?: number;
}
