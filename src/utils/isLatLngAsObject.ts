import { LatLng } from './types/latlng.type';

export function isLatLngAsObject(latlng: unknown): latlng is LatLng {
  if (typeof latlng === 'object') {
    const latlngObj = latlng as unknown as Record<string, unknown>;

    return (
      typeof latlngObj.lat === 'number' &&
      typeof latlngObj.lng === 'number' &&
      Number.isFinite(latlngObj.lat) &&
      Number.isFinite(latlngObj.lng)
    );
  } else {
    return false;
  }
}
