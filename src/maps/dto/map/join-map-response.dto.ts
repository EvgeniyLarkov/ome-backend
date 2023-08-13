import { MapAction } from 'src/maps/entities/map-event.entity';
import { MapParticipantEntity } from 'src/maps/entities/map-participants.entity';
import { ParticipantMapPermissions } from 'src/maps/types/map-permissions.types';

export type JoinMapResponseDTO = {
  actions: MapAction[];
  participant: MapParticipantEntity;
  permissions: ParticipantMapPermissions;
};
