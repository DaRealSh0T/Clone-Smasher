import WebSocket from 'ws';
import { scrapeProxys } from  "./modules/proxyManager.js"
import { Client } from  "./modules/userModule.js"
import config from './config.js';
import * as fs from 'fs';

console.log('Bots maintained by DaRealSh0T and keksbyte');

const wss = new WebSocket.Server({
	port: 3523
});
wss.on('listening', (ws) => {
    scrapeProxys(config.useProxyApi);
})
wss.on('connection', (ws, req) => {
	ws.Client = new Client(ws, req);
});

export function getConfig() {
    return config;
}