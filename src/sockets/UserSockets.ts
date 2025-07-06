import { Server, Socket } from 'socket.io'
import { ISocketToUserMap, IUserToSocketMap, IUserToRoomMap } from '../resources/ISocketMap';
import GameRoom from './GameRoom';
import INewUserResponse from '../resources/INewUserResponse';

// TODO: Need to add room management

export class UserSockets {
    private io: Server;
    private socket_to_user: ISocketToUserMap = {};
    private user_to_socket: IUserToSocketMap = {};
    private user_to_room: IUserToRoomMap = {};
    private rooms: Set<string> = new Set();

    constructor(io: Server) {
        this.io = io
        this.io.on('connection', (socket: Socket) => {
            console.log('Connections:')
            for (const [key, value] of Object.entries(this.user_to_socket)) {
                console.log(`User: ${key}, Socket: ${value.id}`);
            }
            socket.on('new-user', (data, callback) => {
                if (data.name in this.user_to_socket) {
                    callback({ status: 400, message: 'Display name is in use' });
                } else {
                    this.user_to_socket[data.name] = socket;
                    this.socket_to_user[socket.id] = data.name;
                    callback({ status: 200 });
                }
            });

            socket.on('rejoin', (name: string) => {
                if (name in this.user_to_socket) {
                    this.user_to_socket[name] = socket;
                    this.socket_to_user[socket.id] = name;
                    this.rejoinGameRoom(name);
                }
            });

            socket.on('force-disconnect',  () => {
                const username = this.socket_to_user[socket.id];
                delete this.user_to_socket[username];
                delete this.socket_to_user[socket.id];
                console.log(`${username} has fully disconnected.`);
                this.removePlayerFromRoom(username);
            });

            socket.on('disconnect', () => {
               const username = this.socket_to_user[socket.id];
                setTimeout(() => {
                    if (this.user_to_socket[username] && this.user_to_socket[username].id === socket.id) {
                        delete this.user_to_socket[username];
                        delete this.socket_to_user[socket.id];
                        console.log(`${username} has fully disconnected.`);
                        this.removePlayerFromRoom(username);
                    }
                }, 10000); 
            });


            // Handle game creation
            socket.on('create-game', (data, callback) => {
                if (data.gameId in this.rooms) {
                    callback({status: 400, message: "game id already in use "});
                } else {
                    const user = this.getUser(socket.id);
                    this.rooms.add(data.gameId);
                    this.user_to_room[user] = new GameRoom(data.gameId, this);
                    this.user_to_room[user].addPlayer(user, true);
                    socket.join(data.gameId);
                    callback({ status: 200, message: "game created" });
                }
            });

            socket.on('join-game', (data, callback) => {
                if (data.gameId in this.rooms) {
                    const user = this.getUser(socket.id);
                    this.user_to_room[user].addPlayer(user, false);
                    socket.join(data.gameId);
                    callback({ status: 200, message: "game joined" });
                } else {
                    callback({status: 400, message: "game does not exist"});
                }
            });

            socket.on('leave-game', () => {
                const user = this.getUser(socket.id);
                this.removePlayerFromRoom(user);
            });
        });
    };

    public getSocket(user: string) { return this.user_to_socket[user]; };
    public getUser(socket_id: string) { return this.socket_to_user[socket_id]; };
    public shareIO() { return this.io; };

    private removePlayerFromRoom(username: string) {
        if (username in this.user_to_room) {
            const game = this.user_to_room[username];
            game.removePlayer(username);
            this.getSocket(username).leave(game.getId())
            if (game.getHeadCount() <= 0) {
                this.rooms.delete(game.getId());
            };
        };
    };

    private rejoinGameRoom(username: string) {
        if (username in this.user_to_room) {
            this.getSocket(username).join(this.user_to_room[username].getId());
        }
    }
};