import IPlayerData from "./IPlayerData";

export default interface IGameData {
    ledger: string[];
    players: { [key: string]: IPlayerData };
    cards_left: number,
    last_cards_drawn: number[]
}