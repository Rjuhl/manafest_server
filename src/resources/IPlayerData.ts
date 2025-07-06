export enum BidStatus {
    VOTING,
    VOTED,
    NONE
}

export default interface IPlayerData {
    isAdmin: boolean,
    username: string,
    status: BidStatus,
    bid: number
    gold: number
}