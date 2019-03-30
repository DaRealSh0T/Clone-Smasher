const proxyAgent = require('proxy-agent');
const request = require('request');
const WebSocket = require('ws');
const fs = require('fs');
const defaultHeaders = {};

console.log('Bots made by DaRealSh0T');

defaultHeaders["Accept-Encoding"] = "gzip, deflate";
defaultHeaders["Accept-Language"] = "en-CA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7";
defaultHeaders["Cache-Control"] = "no-cache";
defaultHeaders["Connection"] = "Upgrade";
defaultHeaders["Cookie"] = "__cfduid=d557d93bdc916c9975b9a56a883e425021533342031; _ga=GA1.2.115770575.1533950899";
defaultHeaders["Pragma"] = "no-cache";
defaultHeaders["Sec-WebSocket-Extensions"] = "permessage-deflate; client_max_window_bits";
defaultHeaders["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36";

let allProxyAgents = [];
let connectedUsers = 0;
let proxyAgents = [];
let config = {};

function getProxy() {
	if (proxyAgents.length == 0) proxyAgents = allProxyAgents;
	return proxyAgents.shift();
}

if (fs.existsSync('./config.json')) {
	fs.readFile('./config.json', (err, data) => {
		let text = Buffer.from(data).toString();
		config = JSON.parse(text);
		getProxys();
	});
} else {
	let _default = {};
	_default.botNames = ["Sh0T's Bots", "Free Bots"];
	_default.accounts = [""];
	_default.useProxyApi = true;
	_default.useAccount = false;
	_default.maxBots = 100;
	fs.writeFile('config.json', Buffer.from(JSON.stringify(_default, null, 2)), () => {});
	config = _default;
}

function getProxys() {
	if (config.useProxyApi) {
		request('https://www.proxy-list.download/api/v1/get?type=socks5', (err, req, body) => {
			let proxies = body.replace(/\r/g, '').split('\n');
			proxies.forEach(proxy => {
				allProxyAgents.push(new proxyAgent(`socks://${proxy}`));
			});
			console.log(`Got ${proxies.length} proxies!`);
		});
	} else {
		fs.readFile('./proxies.txt', (err, data) => {
			let proxies = data.toString().replace(/\r/g, '').split('\n');
			proxies.forEach(proxy => {
				allProxyAgents.push(new proxyAgent(`socks://${proxy}`));
			});
			console.log(`Got ${proxies.length} proxies!`);
		});
	}
}

class Bot {

	constructor(origin) {
		this.headers = JSON.parse(JSON.stringify(defaultHeaders));
		this.originSplit = origin.split('/')[2];
		this.nameInterval = null;
		this.proxy = getProxy();
		this.origin = origin;
		this.stopped = true;
		this.ws = null;
		this.ip = null;
		this.sId = 0;
	}

	connect(ip, balz) {
		if (!balz && this.originSplit == 'balz.io') return this.balz(ip);
		this.stopped = false;
		this.ip = ip;
		this.headers.Origin = this.origin;
		this.ws = new WebSocket(ip, {
			headers: this.headers,
			agent: this.proxy
		});
		this.ws.binaryType = 'nodebuffer';
		this.ws.onopen = this.onopen.bind(this);
		this.ws.onmessage = this.onmessage.bind(this);
		this.ws.onerror = this.onerror.bind(this);
		this.ws.onclose = this.onclose.bind(this);
	}

	balz(ip) {
		let finIp = ip.split('?')[0];
		let ws = new WebSocket('wss://balz.io/gateway', {
			agent: this.proxy
		});
		ws.onclose = ws.onerror = ws.onopen = () => {};
		ws.onmessage = msg => {
			msg = JSON.parse(msg.data);
			switch (msg[0]) {
				case 0:
					this.sId = msg[1][0];
					finIp += '?session=' + msg[1][1];
					this.connect(finIp, true);
					break;
				case 1:
					ws.send('[1]');
					break;
			}
		};
	}

	onopen() {
		let inits = Buffer.alloc(5);
		inits.writeUInt8(254, 0);
		switch (this.originSplit) {
			case 'agariohub.io':
			case 'agar.bio':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'play.agario0.com':
				inits.writeUInt32LE(1, 1);
				break;
			case 'cellcraft.io':
			case 'www.cellcraft.io':
			case 'army.ovh':
				inits.writeUInt32LE(5, 1);
				break;
			case 'targ.io':
			case 'balz.io':
				inits.writeUInt32LE(6, 1);
				break;
			case 'senpa.io':
				let strings = ['onxcnk_101', Math.random().toString(36).substr(2, 5)];
				let stringsLen = 0;
				strings.map(a => stringsLen += a.length * 2);
				inits = Buffer.alloc(1 + strings.length * 2 + stringsLen);
				var i = 0;
				inits.writeUInt8(252, i++);
				strings.forEach(string => {
					inits.writeUInt16LE(string.length, i);
					i += 2;
					inits.write(string, i, 'ucs2');
					i += string.length * 2;
				});
				break;
		}
		this.send(inits);

		inits = Buffer.alloc(5);
		inits.writeUInt8(255, 0);
		switch (this.originSplit) {
			case 'agariohub.io':
			case 'agar.bio':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'army.ovh':
			case 'play.agario0.com':
				inits.writeUInt32LE(1332175218, 1);
				if (config.useAccount && this.originSplit == 'agariohub.io') this.agarHubLogin();
				break;
			case 'cellcraft.io':
			case 'www.cellcraft.io':
				inits.writeUInt32LE(1332775218, 1);
				break;
			case 'targ.io':
			case 'balz.io':
				inits.writeUInt32LE(1, 1);
				break;
			case 'senpa.io':
				let strings = [config.botNames[Math.floor(Math.random() * config.botNames.length)], '', '', '', ''];
				let stringsLen = 0;
				strings.map(a => stringsLen += a.length * 2);
				inits = Buffer.alloc(1 + strings.length * 2 + stringsLen);
				var i = 0;
				inits.writeUInt8(30, i++);
				strings.forEach(string => {
					inits.writeUInt16LE(string.length, i);
					i += 2;
					inits.write(string, i, 'ucs2');
					i += string.length * 2;
				});
				this.send(new Buffer.from([130]));
				break;
		}
		this.send(inits);

		switch (this.originSplit) {
			case 'cellcraft.io':
			case 'www.cellcraft.io':
				this.send(Buffer.from([42]));
				break;
			case 'balz.io':
				setInterval(() => {
					this.send(Buffer.from([254]));
				}, 1000);
		}

		this.spawn();
		this.nameInterval = setInterval(() => {
			this.spawn();
		}, 3000);
	}

	agarHubLogin() {
		let account = config.accounts[Math.floor(Math.random() * config.accounts.length)];
		let loginBuffer = Buffer.alloc(1 + Buffer.byteLength(account, 'ucs2'));

		loginBuffer.writeUInt8(30, 0);
		loginBuffer.write(account, 1, 'ucs2');
		this.send(loginBuffer);
	}

	nameBypass() {
		function _0x67e0x24(_0x67e0x3) {
			for (var _0x67e0x4 = _0x67e0x3; _0x67e0x4 >= 36;) {
				_0x67e0x4 = ~~(_0x67e0x4 / 36) + _0x67e0x4 % 36
			};
			return _0x67e0x4.toString(36)
		}
		var _0x67e0x3 = Math.round(Date.now() / 1e3) % 1e3,
			_0x67e0x4 = 1e3 * (1e3 * (100 + Math.floor(900 * Math.random())) + _0x67e0x3) + (100 + Math.floor(900 * Math.random()));
		return _0x67e0x24(_0x67e0x4) + _0x67e0x4.toString(36) + function (_0x67e0x3) {
			var _0x67e0x4 = 1 / _0x67e0x3;
			for (; _0x67e0x4 < 100;) {
				_0x67e0x4 *= 19
			};
			return _0x67e0x24(~~_0x67e0x4)
		}(_0x67e0x4)
	}

	spawn() {
		let name = config.botNames[Math.floor(Math.random() * config.botNames.length)];
		let spawnBuffer = null;
		switch (this.originSplit) {
			case 'agariohub.io':
				name = this.nameBypass() + '&' + name;
			case 'agar.bio':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'agarios.org':
			case 'army.ovh':
			case 'play.agario0.com':
				spawnBuffer = Buffer.alloc(1 + Buffer.byteLength(name, 'ucs2'));
				spawnBuffer.write(name, 1, 'ucs2');
				break;
			case 'cellcraft.io':
			case 'www.cellcraft.io':
				spawnBuffer = Buffer.alloc(3 + Buffer.byteLength(name, 'ucs2'));
				spawnBuffer.writeUInt16LE(59, 1);
				spawnBuffer.write(name, 3, 'ucs2');
				break;
			case 'targ.io':
				spawnBuffer = Buffer.alloc(1 + Buffer.byteLength(name, 'utf8'));
				spawnBuffer.write(name, 1, 'utf8');
				break;
			case 'senpa.io':
				this.send(new Buffer.from([130]));
				spawnBuffer = Buffer.from([31]);
				break;
			case 'balz.io':
				name = '(' + this.sId + ')' + name;
				spawnBuffer = Buffer.alloc(1 + Buffer.byteLength(name, 'utf8'));
				spawnBuffer.write(name, 1, 'utf8');
				break;
		}
		this.send(spawnBuffer);
	}

	sendChat(message) {
		let chatBuffer;
		switch (this.originSplit) {
			case 'agar.bio':
			case 'cellcraft.io':
			case 'www.cellcraft.io':
			case 'bomb.agar.bio':
			case 'm.agar.bio':
			case 'agarios.org':
			case 'army.ovh':
			case 'play.agario0.com':
				chatBuffer = Buffer.alloc(2 + message.length * 2);
				chatBuffer.writeUInt8(99, 0);
				chatBuffer.write(message, 2, 'ucs2');
				break;
			case 'balz.io':
			case 'targ.io':
				chatBuffer = Buffer.alloc(3 + message.length);
				chatBuffer.writeUInt8(99, 0);
				chatBuffer.write(message, 2, 'utf8');
				break;
		}
		this.send(chatBuffer);
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

		if (this.ip)
			this.connect(this.ip);
	}

	onerror(error) {}

	send(buffer) {
		if (this.ws && this.ws.readyState == 1)
			this.ws.send(buffer);
	}

}

class Client {

	constructor(ws, req) {
		this.origin = req.headers.origin;
		this.botConnectInt = [];
		this.started = false;
		this.bots = [];
		this.ws = ws;
		this.setup();
		connectedUsers++;
		console.log(`A user has connected! Connected users: ${connectedUsers}`);
	}

	setup() {
		this.ws.on('message', this.onmessage.bind(this));
		this.ws.on('close', this.onclose.bind(this));
		this.ws.on('error', this.onerror.bind(this));
		for (let i = 0; i < config.maxBots; i++)
			this.bots.push(new Bot(this.origin));
		this.startBotCount();
	}

	onmessage(message) {
		const json = JSON.parse(message);
		switch (json.type) {

			case 'start':
				this.startBots(json.ip, this.origin);
				console.log('user started bots on ', this.origin)
				break;

			case 'stop':
				this.stopBots();
				break;

			case 'updatePos':
				this.sendBotPos(json.x, json.y, json.byteLen);
				break;

			case 'split':
				this.bots.forEach(bot => {
					bot.send(Buffer.from([17]));
				});
				break;

			case 'chat':
				this.bots.forEach(bot => {
					bot.sendChat(json.msg);
				});
				break;

			case 'eject':
				this.bots.forEach(bot => {
					bot.send(Buffer.from([21]));
					bot.send(Buffer.from([36]));
				});
				break;
		}
	}

	sendBotPos(x, y, byteLen) {
		if (!byteLen) return;
		let mouseBuffer = Buffer.alloc(byteLen);

		mouseBuffer.writeUInt8(16, 0);
		switch (byteLen) {
			case 13:
			case 9:
				mouseBuffer.writeInt32LE(x, 1);
				mouseBuffer.writeInt32LE(y, 5);
				break;
			case 21:
				mouseBuffer.writeDoubleLE(x, 1);
				mouseBuffer.writeDoubleLE(y, 9);
				break;
		}

		this.bots.forEach(bot => {
			bot.send(mouseBuffer);
		});
	}

	startBotCount() {
		this.botCountInt = setInterval(() => {
			let json = {
				type: 'botCount',
				connected: 0,
				maxBots: config.maxBots
			};
			this.bots.forEach(bot => {
				if (bot.ws && bot.ws.readyState == 1)
					json.connected++;
			});
			this.send(json);
		}, 100);
	}

	stopBotCount() {
		clearInterval(this.botCountInt);
	}

	onclose() {
		this.stopBots();
		this.stopBotCount();
		connectedUsers--;
		console.log(`A user has disconnected! Connected users: ${connectedUsers}`);
	}

	stopBots() {
		if (!this.started) return;
		clearInterval(this.botInterval);
		this.bots.forEach(bot => {
			bot.close();
		});
		this.botConnectInt.forEach(clearInterval);
		this.started = false;
	}

	startBots(serverip) {
		if (this.started) return;
		this.bots.forEach((bot, i) => {
			this.botConnectInt.push(setTimeout(() => {
				if (!this.started) return;
				bot.connect(serverip);
			}, 300 * i));
		});
		this.started = true;
	}

	onerror() {}

	send(message) {
		if (this.ws && this.ws.readyState == 1) this.ws.send(JSON.stringify(message));
	}

}

const wss = new WebSocket.Server({
	port: 3523
});

wss.on('connection', (ws, req) => {
	ws.Client = new Client(ws, req);
});