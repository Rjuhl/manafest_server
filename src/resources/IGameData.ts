import IPlayerData from "./IPlayerData";

export default interface IGameData {
    ledger: string[];
    players: { [key: string]: IPlayerData };
}