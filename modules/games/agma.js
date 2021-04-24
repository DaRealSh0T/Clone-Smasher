import { getProxy } from '../proxyManager.js';
import { getConfig } from '../../server.js';
import WebSocket from 'ws';
import request from 'request';
import qs from 'qs';
//import * as fs from 'fs';

class Bot {
	constructor(origin) {
		this.spawnInterval = null;
		this.pingInterval = null;
		this.proxy = getProxy();
		this.origin = origin;
		this.stopped = true;
		this.ws = null;
		this.ip = null;
		this.agma = new Agma();
	}

	async connect(ip) {
		this.stopped = false;
		this.ip = ip;
		this.agma.reset();
		this.proxy = getProxy();
		const cookie = await this.agma.getCookie(this.proxy).catch(() => null);
		if (!cookie) return this.onclose();
		this.ws = new WebSocket(ip, {
			headers: {
				'Accept-Encoding': 'gzip, deflate',
				'Accept-Language': 'en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache',
				Origin: 'https://agma.io',
				Cookie: cookie,
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.74',
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
		const init = Buffer.alloc(13);
		init[0] = 245;
		init.writeUInt16LE(Agma.ext_port, 1);
		init.writeUInt16LE(Agma.key, 3);
		init.writeUInt32LE(this.agma.chunkOffset, 5);
		init.writeUInt32LE(this.agma.round(init, 0, 9, 245), 9);
		this.send(init);

		this.pingInterval = setInterval(() => {
			if (this.agma.readyToSpawn) this.send([0x5f]);
		}, 18e3);
		this.spawnInterval = setInterval(this.spawn.bind(this), 1000);
	}

	mouse(x, y) {
		if (!this.agma.readyToSpawn) return;
		let buffer = Buffer.alloc(9);
		buffer.writeInt32LE(x, 1);
		buffer.writeInt32LE(y, 5);
		this.send(buffer);
	}

	spawn() {
		if (!this.agma.readyToSpawn) return;
		let name =
			getConfig().botNames[
				Math.floor(Math.random() * getConfig().botNames.length)
			] +
			' | ' +
			Math.random().toString(36).slice(2);
		let spawnBuffer = Buffer.alloc(4 + Buffer.byteLength(name, 'ucs2'));
		spawnBuffer[0] = 0x01;
		spawnBuffer.write(name, 4, 'ucs2');
		this.send([0x22]);
		this.send(spawnBuffer);
	}

	sendChat(message) {
		let chatBuffer = Buffer.alloc(2 + Buffer.byteLength(message, 'ucs2'));
		chatBuffer.writeUInt8(0x62, 0);
		chatBuffer[1] = 0x01;
		chatBuffer.write(message, 2, 'ucs2');
		this.send(chatBuffer);
	}

	split() {
		this.send([0x11]);
	}

	eject() {
		this.send([0x15]);
		this.send([0x24]);
	}

	onmessage({ data }) {
		let buffer = Buffer.from(data);
		let offset = 0;
		if (buffer[0] == 240) offset += 5;
		let opcode = buffer[offset++];

		switch (opcode) {
			case 64:
				offset += 34;
				var date = data.readUInt32LE(offset);
				offset += 4;
				var key = data.readUInt32LE(offset);

				if (date === key && this.agma.selector < 70) {
					this.agma.selector += 40;
					this.agma.getWidth = date;
					this.agma.getWidth--;
					let buf = this.agma.replace(0);
					if (buf) this.send(buf);
				} else {
					this.ws.close();
					console.log('Missmatch in 64 packet');
				}
				break;
			case 32:
				this.send([13]);
				break;
			case 244:
				this.agma.readyToSpawn = true;

				var isManualMouseBR = true;
				var tooltip = true;
				var isCMBkR = false;

				this.sendState(7, ~~isManualMouseBR);
				this.sendState(8, ~~isCMBkR);
				this.sendState(3, ~~tooltip);
				break;
		}
	}

	sendState(id, data) {
		if (this.agma.readyToSpawn) this.send([4, id, data]);
	}

	close() {
		this.stopped = true;

		if (this.ws) this.ws.close();
	}

	onclose(error) {
		clearInterval(this.spawnInterval);
		clearInterval(this.pingInterval);
		if (this.stopped) return;
		this.proxy = getProxy();

		if (this.ip) this.connect(this.ip);
	}

	onerror(error) {}

	send(buffer) {
		if (this.ws && this.ws.readyState == 1) this.ws.send(Buffer.from(buffer));
	}
}

class Agma {
	constructor() {
		this.reset();
	}

	get array() {
		var o = '~9B\\x$';
		return [
			o.charCodeAt(0),
			o.charCodeAt(1),
			o.charCodeAt(2) + 73,
			o.charCodeAt(3),
			o.charCodeAt(4) + 227,
			o.charCodeAt(5),
		];
	}

	getCookie(proxy) {
		return new Promise(async (resolve, reject) => {
			let jar = request.jar();
			request.get(
				'https://agma.io/',
				{
					jar,
					gzip: true,
					//agent: proxy,
					headers: {
						authority: 'agma.io',
						'cache-control': 'max-age=0',
						'upgrade-insecure-requests': '1',
						'user-agent':
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.74',
						accept:
							'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
						'sec-fetch-site': 'none',
						'sec-fetch-mode': 'navigate',
						'sec-fetch-user': '?1',
						'sec-fetch-dest': 'document',
						'accept-language': 'en-US,en;q=0.9',
					},
				},
				(err, req, res) => {
					if (err) return reject();
					let form = qs.stringify({
						data: JSON.stringify({
							cv: 4 * this.chunkOffset,
							ch: this.selector,
							ccv: this.chunkOffset + 1,
							vv: Agma.key,
						}),
					});

					request.post(
						'https://agma.io/client.php',
						{
							jar,
							gzip: true,
							//agent: proxy,
							headers: {
								accept: 'text/plain, */*; q=0.01',
								'accept-encoding': 'gzip, deflate',
								'accept-language': 'en-US,en;q=0.9',
								'content-type':
									'application/x-www-form-urlencoded; charset=UTF-8',
								origin: 'https://agma.io',
								referer: 'https://agma.io/',
								'sec-fetch-dest': 'empty',
								'sec-fetch-mode': 'cors',
								'sec-fetch-site': 'same-origin',
								'user-agent':
									'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.74',
								'x-requested-with': 'XMLHttpRequest',
							},
							form,
						},
						(err, req, body) => {
							if (err) return reject();
							let cookie = req.request.headers.cookie;
							this.label = this.readResponse(body.toString());
							for (var i = 0; i < Agma.emgaa.length; i++)
								this.numChars +=
									Agma.emgaa.charCodeAt(i) * (1 - (!i || i % 2 ? 0 : 2)) -
									1 * (i ? 0 : 1);
							--this.numChars;
							resolve(cookie);
						}
					);
				}
			);
		});
	}

	readResponse(num) {
		num = num.toString();

		var ksksksv = Buffer.from('sup,sora?', 'utf-8');
		//	ksksksv[5] -= 0x07;
		ksksksv = 'eGJveE9yUHM0Pw==';
		var vkx = ksksksv.toString().substr(2, 4);
		var blockGap = 5 + 2 * vkx.charCodeAt(0);
		var progress = 0;
		if (!isNaN(num)) {
			if (5 < num.length) {
				var right = num.substr(0, 5);
				var date = num.substr(5);
				if (!isNaN(right) && !isNaN(date)) {
					var checkVal = 0;
					for (var i = 0; i < right.length; i++)
						checkVal =
							checkVal +
							(parseInt(right.substr(i, 1)) +
								30 +
								vkx.charCodeAt(1) +
								blockGap) *
								(i + 1);
					if (checkVal == parseInt(date))
						progress = Math.max(parseInt(right) - 10000, 0);
				}
			} else progress = parseInt(num);
		}
		return progress;
	}

	reset() {
		this.readyToSpawn = false;
		this.chunkOffset = ~~(5535 + 6e4 * Math.random()) + 1;
		this.numChars = 5;
		this.getWidth = -1;
		this.selector = 50;
		this.label = 0;
	}

	round(buffer, offset, length, n) {
		if (offset + length > buffer.byteLength) length = 0;

		var s = 12345678 + n;
		var i = 0;
		for (; length > i; i++) s = s + buffer.readUInt8(offset + i) * (i + 1);
		return s;
	}

	replace(selector) {
		if (this.getWidth == -1 || selector) return null;
		this.selector = 100;
		var buffer = Buffer.alloc(13);
		buffer.writeUInt8(
			2 * (this.selector + 30) - ((this.getWidth - 5) % 10) - 5
		);
		buffer.writeUInt32LE(
			~~(
				this.getWidth / 1.84 +
				this.selector / 0x2 -
				0x2 * (selector ? 0.5 : 0x1)
			) +
				(_0x528fbc => {
					return ~~(
						~~(
							21.22 *
							((~~(this.getWidth + 4.42 * this.chunkOffset + 0x22b) %
								--_0x528fbc) -
								0x8e08)
						) / 4.2
					);
				})(this.label),
			1
		);
		buffer.writeUInt32LE(this.sortDataByVersion + this.numChars, 5);
		buffer.writeUInt32LE(this.round(buffer, 0, 9, 255) + 1, 9);
		return buffer;
	}

	get sortDataByVersion() {
		var source = 0;
		var i = 0;
		for (; i < this.array.length; i++)
			source =
				source +
				~~(this.getWidth / this.array[i] - (this.array[i] % this.numChars));
		return source;
	}

	static get ext_port() {
		return 0x1b;
	}

	static get key() {
		return 0x7d;
	}

	static get emgaa() {
		return 'Agma!';
	}
}

export { Bot };
