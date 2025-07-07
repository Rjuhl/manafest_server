import type { Socket } from 'socket.io';
import GameRoom from '../sockets/GameRoom';

export interface IUserToSocketMap {
  [key: string]: Socket;
}

export interface ISocketToUserMap {
  [key: string]: string;
}

export interface IUserToRoomMap {
  [key: string]: GameRoom;
}

export interface IRoomToRoom {
  [key: string]: GameRoom;
}