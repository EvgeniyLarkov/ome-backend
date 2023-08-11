export function isLatLngAsObject(
  latlng: unknown,
): latlng is { lat: number; lng: number } {
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
