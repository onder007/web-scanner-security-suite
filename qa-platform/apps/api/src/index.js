"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_socket_io_1 = __importDefault(require("fastify-socket.io"));
const ScanManager_1 = require("./services/ScanManager");
const server = (0, fastify_1.default)({ logger: true });
server.register(cors_1.default, {
    origin: '*', // For development
});
server.register(fastify_socket_io_1.default, {
    cors: {
        origin: '*',
    },
});
server.post('/api/scan', async (request, reply) => {
    const { url } = request.body;
    if (!url) {
        return reply.status(400).send({ error: 'URL is required' });
    }
    // Emit event indicating scan started
    server.io.emit('scan_started', { url, timestamp: new Date().toISOString() });
    const scanManager = new ScanManager_1.ScanManager(server.io);
    scanManager.startScan(url).catch(err => server.log.error(err));
    return reply.send({ success: true, message: `Scan initiated for ${url}` });
});
server.ready().then(() => {
    server.io.on('connection', (socket) => {
        server.log.info(`Socket connected: ${socket.id}`);
        socket.on('disconnect', () => {
            server.log.info(`Socket disconnected: ${socket.id}`);
        });
    });
});
const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Server running on http://localhost:3001');
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
