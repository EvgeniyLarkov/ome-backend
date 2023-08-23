import { OMEActionsData } from 'src/maps/types/map-action.types';
import { mapActionTypes } from '../../types/map.types';

export class MapActionDB<T extends OMEActionsData> {
  hash?: string;
  type: mapActionTypes;
  status: number;
  lat: number | null;
  lng: number | null;
  data?: T;
  creatorHash: string;
  mapHash: string;
  version?: number;
  deletedAt?: Date;
  createdAt?: Date;
}
