import { Server, Socket } from 'socket.io';
import { UserSockets } from './UserSockets';

export default function socketHandler(io: Server): void {
    const users = new UserSockets(io);
    
}