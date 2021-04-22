import { getProxy } from '../proxyManager.js';
import { getConfig } from '../../server.js';
import WebSocket from 'ws';
//import * as fs from 'fs';

class Bot {
	constructor(origin) {
		this.nameInterval = null;
		this.proxy = getProxy();
		this.origin = origin;
		this.stopped = true;
		this.ws = null;
		this.ip = null;
	}

	connect(ip) {
		this.stopped = false;
		this.ip = ip;
		this.ws = new WebSocket(ip, {
			headers: {
				'Accept-Encoding': 'gzip, deflate',
				'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache',
				Origin: this.origin,
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36',
			},
			agent: this.proxy,
			rejectUnauthorized: false,
		});
		this.ws.binaryType = 'nodebuffer';
		this.ws.onopen = this.onopen.bind(this);
		this.ws.onmessage = this.onmessage.bind(this);
		this.ws.onerror = this.onerror.bind(this);
		this.ws.onclose = this.onclose.bind(this);
	}

	onopen() {
		let inits = Buffer.alloc(5);
		inits.writeUInt8(254, 0);
		inits.writeUInt32LE(5, 1);
		this.send(inits);

		inits = Buffer.alloc(5);
		inits.writeUInt8(255, 0);
		this.send(inits);

		this.spawn();
		this.nameInterval = setInterval(() => {
			this.spawn();
		}, 3000);
	}

	spawn() {
		let name = getConfig().botNames[
			Math.floor(Math.random() * getConfig().botNames.length)
		];
		let spawnBuffer = Buffer.alloc(1 + Buffer.byteLength(name, 'ucs2'));
		spawnBuffer.write(name, 1, 'ucs2');
		this.send(spawnBuffer);
	}

	sendChat(message) {
		let chatBuffer = Buffer.alloc(2 + Buffer.byteLength(message, 'ucs2'));
		chatBuffer.writeUInt8(99, 0);
		chatBuffer.write(message, 2, 'ucs2');
		this.send(chatBuffer);
	}

	split() {
		this.send([17]);
	}

	eject() {
		this.send([21]);
	}

	mouse(x, y) {
		let buffer = Buffer.alloc(21);
		buffer[0] = 0x10;
		buffer.writeDoubleLE(x, 1);
		buffer.writeDoubleLE(y, 9);
		this.send(buffer);
	}

	onmessage(message) {} //not needed at the moment

	close() {
		this.stopped = true;

		if (this.ws) this.ws.close();
	}

	onclose(error) {
		clearInterval(this.nameInterval);
		if (this.stopped) return;
		this.proxy = getProxy();

		if (this.ip) this.connect(this.ip);
	}

	onerror(error) {}

	send(buffer) {
		if (this.ws && this.ws.readyState == 1) this.ws.send(buffer);
	}
}

export { Bot };
