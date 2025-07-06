import IGameData from "../resources/IGameData";
import IPlayerData from "../resources/IPlayerData";
import { BidStatus } from "../resources/IPlayerData";
import { UserSockets } from "./UserSockets";
import { Server, Socket } from 'socket.io'

export default class GameRoom {
    private admin?: string;
    private roomId: string;
    private ledger: string[] = [];
    private players: { [key: string]: IPlayerData } = {};
    private user_sockets: UserSockets;

    // Bidding state
    private bidding = false;
    private votes: { user: string, bid: number }[] = [];

    constructor(roomId: string, user_sockets: UserSockets) { 
        this.roomId = roomId; 
        this.user_sockets = user_sockets;

        this.user_sockets.shareIO().on('connection', (socket: Socket) => {
            socket.on('add-gold', (data) => {
                const user = this.user_sockets.getUser(socket.id);
                if (user in this.players) {
                    this.players[user].gold += data.gold;
                    this.ledger.push(`${user} added ${data.gold} to their balance`);
                    this.updateClient();
                }
            });

            socket.on('start-bid', (data, callback) => {
                const user = this.user_sockets.getUser(socket.id);
                if (user in this.players) {
                    if (user !== this.admin) {
                        callback({status: 400, message: "must be admin to start bid"});
                    } else if (this.bidding) {
                        callback({status: 400, message: "bid already in progress"});
                    } else {
                        this.bidding = true;
                        for (const key of Object.keys(this.players)) {
                            this.players[key].status = BidStatus.VOTING;
                        };
                        callback({status: 200, message: "bid started"});
                        this.updateClient();
                    };
                };
                
            });

            socket.on('bid', (data, callback) => {
                const user = this.user_sockets.getUser(socket.id);
                if (user in this.players && this.bidding) {
                    if (data.bid > this.players[user].gold) {
                        callback({status:400, message: `you can't bid ${data.bid} you only have ${this.players[user].gold} gold`});
                    } else if (this.players[user].status === BidStatus.VOTED) {
                        callback({status:400, message: 'you cannot bid twice in auction'});
                    } else {
                        this.votes.push({ user: user, bid: data.bid });
                        this.players[user].status = BidStatus.VOTED;
                        this.returnBid();
                    }
                }
            });

            socket.on('get-game-info', (data, callback) => {
                callback({status:200, data: this.getGameData()});
            });
        });
    };

    public addPlayer(name: string, admin: boolean) {
        if (admin) this.admin = name;
        this.players[name] = {
            isAdmin: admin,
            username: name,
            status: BidStatus.NONE,
            bid: 0,
            gold: 20
        }

        this.ledger.push(`${name} joined ${this.roomId}. Admin = ${admin}`);
        this.updateClient();
    }

    public removePlayer(name: string) {
        if (name in this.players) {
            delete this.players[name];
            if (name === this.admin && this.getHeadCount() > 0) {
                Object.entries(this.players)[0][1].isAdmin = true;
            };

            this.returnBid();
        };
    };

    public getHeadCount() { return Object.keys(this.players).length ; }; 
    public getId() { return this.roomId; }; 

    private getGameData() {
        return  {
            ledger: this.ledger,
            players: this.players,
        };
    }

    private updateClient() {
        this.user_sockets.shareIO().to(this.roomId).emit('game-update', this.getGameData());
    };

    private returnBid() {
        if (this.bidding === true && this.votes.length === this.getHeadCount()) {
            this.votes.sort((a, b) => b.bid - a.bid);
            this.bidding = false;
            this.players[this.votes[0].user].gold -= this.votes[0].bid;
            this.ledger.push(`---------- BID RESULTS -----------`);
            this.ledger.push(`!!!! ${this.votes[0]} Won the Bid !!!!`);
            for (const vote of this.votes) {
                this.ledger.push(`${vote.user} bid ${vote.bid}`);
                this.players[vote.user].status = BidStatus.NONE;
            }
            this.votes = [];
            this.updateClient();
        };
    };
}