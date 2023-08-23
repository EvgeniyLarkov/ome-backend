import { LatLng } from 'src/utils/types/latlng.type';
import { MapActionDB } from '../dto/actions/map-event.db';
import { MAP_ACTION_TYPES } from './map.types';

export type OMEActionsData = PolylineData | MarkerData | PolygoneData;

export type DefaultActionsData = {
  name?: string;
  description?: string;
};

export type PolylineData = DefaultActionsData & {
  coordinates: [LatLng, LatLng];
};

export type PolygoneData = DefaultActionsData & {
  coordinates: LatLng[];
};

export type MarkerData = DefaultActionsData & Record<string, unknown>;

export const isActionPolyline = (
  action: MapActionDB<OMEActionsData>,
): action is MapActionDB<PolylineData> => {
  return action.type === MAP_ACTION_TYPES.polyline;
};

export const isActionMarker = (
  action: MapActionDB<OMEActionsData>,
): action is MapActionDB<MarkerData> => {
  return action.type === MAP_ACTION_TYPES.marker;
};

export const isActionPolygone = (
  action: MapActionDB<OMEActionsData>,
): action is MapActionDB<PolygoneData> => {
  return action.type === MAP_ACTION_TYPES.polygone;
};
