let connectedUsers = 0;
import { getConfig } from  "../server.js"
 class Client {
	constructor(ws, req, botMod) {
		this.origin = req.headers.origin;
		this.botConnectInt = [];
        this.botMod = botMod;
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
		for (let i = 0; i < getConfig().maxBots; i++)
			this.bots.push(new this.botMod(this.origin));
		this.startBotCount();
	}

	onmessage(message) {
		const json = JSON.parse(message);
		switch (json.type) {

			case 'start':
				this.startBots(json.ip, this.origin);
				console.log('user started bots on ', this.origin, " ip: ", json.ip)
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
				maxBots: getConfig().maxBots
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

export { Client };