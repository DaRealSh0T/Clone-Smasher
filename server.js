import WebSocket from 'ws';
import { scrapeProxys } from  "./modules/proxyManager.js"
import { Client } from  "./modules/userModule.js"
import { Bot } from  "./modules/botModule.js"
import * as fs from 'fs';

let config = {};
const wss = new WebSocket.Server({
	port: 3523
});
wss.on('listening', (ws) => {
    readConfig()
})
wss.on('connection', (ws, req) => {
	ws.Client = new Client(ws, req, Bot);
});

function readConfig(){
    fs.readFile('./config.json', (err, data) => {
        let text = Buffer.from(data).toString();
        config = JSON.parse(text);
        scrapeProxys(config.useProxyApi);
    });
}

export function getConfig(){
    return config;
}