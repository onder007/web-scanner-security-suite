import { Server } from 'socket.io';
export declare class ScanManager {
    private io;
    constructor(io: Server);
    startScan(url: string): Promise<void>;
}
