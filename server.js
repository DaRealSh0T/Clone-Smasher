import WebSocket from 'ws';
import { scrapeProxys } from  "./modules/proxyManager.js"
import { Client } from  "./modules/userModule.js"
import config from './config.js';
import * as fs from 'fs';

console.log('Bots maintained by DaRealSh0T and keksbyte');

const wss = new WebSocket.Server({
	port: 3523
});

function parsePT(pt) {
    var type = pt.toLowerCase();
    if (!['socks4', 'socks5', 'http'].includes(type))
        type = 'socks4';
    return type;
}
wss.on('listening', (ws) => {
    scrapeProxys(config.useProxyApi, parsePT(config.proxyType));
})
wss.on('connection', (ws, req) => {
	ws.Client = new Client(ws, req);
});

export function getConfig() {
    return config;
}