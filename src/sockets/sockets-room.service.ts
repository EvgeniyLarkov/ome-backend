import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SocketRoomService {
  // Socket id to participant hash
  private sidToPhash = new Map<string, string>();
  // Room id to participant hashes
  private roomIdToPhash = new Map<string, Set<string>>();

  // Participant hash to sockets (can be multiple sockets to 1 participant)
  private phashToSockets = new Map<string, Map<string, Socket>>();

  //Socket id to room id
  private sidToRooms = new Map<string, Set<string>>();

  join(participantHash: string, roomHash: string, client: Socket): boolean {
    const sid = client.id;

    let room = this.sidToRooms.get(sid);

    if (!room) {
      room = new Set();
      room.add(roomHash);
      this.sidToRooms.set(sid, room);
    } else {
      room.add(roomHash);
    }

    /////////////////////////

    this.sidToPhash.set(sid, participantHash);

    /////////////////////////

    let sockets = this.phashToSockets.get(participantHash);

    if (!sockets) {
      sockets = new Map();
      this.phashToSockets.set(participantHash, sockets);
    }

    sockets.set(sid, client);

    /////////////////////////

    let roomPList = this.roomIdToPhash.get(roomHash);

    if (!roomPList) {
      roomPList = new Set();
      this.roomIdToPhash.set(roomHash, roomPList);
    }

    roomPList.add(participantHash);

    return true;
  }

  leave(participantHash: string, roomHash: string, client: Socket): boolean {
    const sid = client.id;

    const room = this.sidToRooms.get(sid);

    if (room) {
      room.delete(roomHash);
    }

    /////////////////////////

    const sockets = this.phashToSockets.get(participantHash);

    if (sockets) {
      sockets.delete(sid);
    }

    /////////////////////////

    const phashSids = this.phashToSockets.get(participantHash);
    const activeSids = phashSids.keys();

    let needToDropFromRoom = true;

    [...activeSids].forEach((activeSid) => {
      const thisRooms = this.sidToRooms.get(activeSid);
      if (thisRooms && thisRooms.has(roomHash)) {
        needToDropFromRoom = false;
      }
    });

    if (needToDropFromRoom) {
      const roomPList = this.roomIdToPhash.get(roomHash);
      if (roomPList) {
        roomPList.delete(participantHash);
      }
    }

    return true;
  }

  disconnect(client: Socket) {
    const sid = client.id;
    const participantHash = this.sidToPhash.get(sid);

    this.sidToPhash.delete(sid);

    const participantSids = this.phashToSockets.get(participantHash);
    if (participantSids) {
      participantSids.delete(sid);
    }

    const activeParticipantSid = this.phashToSockets.get(participantHash);

    const participantRooms = this.sidToRooms.get(sid);

    if (participantRooms) {
      [...participantRooms.keys()].forEach((roomHash) => {
        const room = this.roomIdToPhash.get(roomHash);

        let dropPHashFromRoom = true;
        [...activeParticipantSid.keys()].forEach((sid) => {
          if (room && room.has(sid)) {
            dropPHashFromRoom = false;
          }
        });

        if (dropPHashFromRoom && room) {
          room.delete(participantHash);
        }
      });
    }

    this.sidToRooms.delete(sid);

    return true;
  }

  getRoomParticipants(roomHash: string): User['hash'][] {
    const roomParticipants = this.roomIdToPhash.get(roomHash);

    return roomParticipants ? [...roomParticipants.keys()] : [];
  }
}
