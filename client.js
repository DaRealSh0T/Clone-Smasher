// ==UserScript==
// @name         Clone Smasher
// @namespace    https://youtube.com/DaRealSh0Tv2
// @version      1.0.1
// @description  The BEST agar clone bots!
// @author       DaRealSh0T & keksbyte
// @match        *agma.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

if (location.origin.includes('imbig.pro') || location.origin.includes('myagar.pro')) {
	window.addEventListener('DOMContentLoaded', () => {
		window.aiptag = {
			adplayer: 'yes',
			cmd: {
				display: []
			}
		};
	});
}
const observer = new MutationObserver(mutations => {
	mutations.forEach(({
		addedNodes
	}) => {
		addedNodes.forEach(node => {
			if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
				const src = node.src || '';
				if (src.includes('assets/js/ext.js')) {
					node.src = '';
					window.playnow = () => {
						setNick(document.getElementById('nick').value);
						return false;
					}
				} else if (src.includes('minimap.js') || node.innerHTML.toString().includes('cicklow_XcVCCW')) {
					node.type = 'javascript/blocked';
					node.parentElement.removeChild(node);
				} else if (src.includes('api.adinplay.com')) {
					node.type = 'javascript/blocked';
					node.parentElement.removeChild(node);
				}
			}
		});
	});
});
observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

class User {

	constructor() {
		this.wsIp = 'ws://localhost:3523';
		this.started = false;
		this.x = this.y = 0;
		this.mouseInt = -1;
		this.server = '';
		this.ws = null;
		this.connect();
		this.addUI();
	}

	connect() {
		this.ws = new WebSocket(this.wsIp);
		this.ws.onmessage = this.onmessage.bind(this);
		this.ws.onerror = this.onerror.bind(this);
		this.ws.onclose = this.onclose.bind(this);
		this.ws.onopen = this.onopen.bind(this);
	}

	onopen() {
		this.startMouseInt();
		this.started = false;
	}

	startMouseInt() {

		this.mouseInt = setInterval(() => {

			let json = {};

			json.type = "updatePos";
			json.x = this.x;
			json.y = this.y;

			this.send(json);

		}, 50);

	}

	sendChat(message) {
		let json = {};

		json.type = "chat";
		json.msg = message;

		this.send(json);
	}

	onmessage(message) {
		message = JSON.parse(message.data);

		switch (message.type) {

			case 'botCount':
				document.getElementById('botCount').innerText = `${message.connected}/${message.maxBots}`;
				break;

		}
	}

	onclose() {
		setTimeout(this.connect(), 1500);
		clearInterval(this.mouseInt);
	}

	startBots() {
		let json = {};

		json.type = "start";
		json.ip = this.server;

		this.send(json);
	}

	stopBots() {
		this.send({
			type: 'stop'
		});
	}

	addUI() {
		let ui = document.createElement('div');
		ui.id = 'botcanvas';
		ui.style['background'] = 'rgba(0,0,0,0.4)';
		ui.style['top'] = '50px';
		ui.style['left'] = '9px';
		ui.style['display'] = 'block';
		ui.style['position'] = 'absolute';
		ui.style['text-align'] = 'center';
		ui.style['font-size'] = '15px';
		ui.style['color'] = '#FFFFFF';
		ui.style['padding'] = '7px';
		ui.style['z-index'] = '1000000';
		ui.innerHTML += 'Bots: ';
		let count = document.createElement('span');
		count.id = 'botCount';
		count.innerHTML = 'WAITING';
		ui.appendChild(count);
		document.body.appendChild(ui);
		document.getElementById('botcanvas').onclick = () => {
			if (!this.started)
				this.startBots();
			else
				this.stopBots();
			this.started = !this.started;
		};
	}

	onerror() {}

	send(message) {
		if (this.ws && this.ws.readyState == 1) this.ws.send(JSON.stringify(message));
	}

	get isTyping() {
		return document.querySelectorAll('input:focus').length;
	}

	keyDown(event) {
		if (this.isTyping || !event.key) return;
		switch (event.key.toLowerCase()) {

			case 'e':
				this.send({
					type: 'split'
				});
				break;

			case 'r':
				this.send({
					type: 'eject'
				});
				break;

				case 'c':
					let msg = prompt('What do you want the bots to say?', 'Clone Smasher');
					if (msg) this.sendChat(msg);
					break;

		}
	}

}
if (location.host.includes('agma.io') || location.host.includes('cellcraft.io')) {
    let client = null;
	window.WebSocket = class extends WebSocket {
		constructor() {
			let ws = super(...arguments);
			window.sockets?.push(this);

			setTimeout(() => {
				ws.onmessage = new Proxy(ws.onmessage, {
					apply(target, thisArg, argArray) {
						let data = argArray[0].data;
						return target.apply(thisArg, argArray);
					}
				});
			});
		}
	}

	WebSocket.prototype.send = new Proxy(WebSocket.prototype.send, {
		apply(target, thisArg, argArray) {
            var res = target.apply(thisArg, argArray);
			let pkt = argArray[0];
            if (!client) return;
            if (typeof pkt == 'string') return res;
            if (thisArg.url.includes('localhost')) return res;
			if (pkt instanceof ArrayBuffer) pkt = new DataView(pkt);
            else if (pkt instanceof DataView) pkt = pkt;
            else pkt = new DataView(pkt.buffer);
            switch (pkt.getUint8(0, true)) {
                case 0:
                    switch (pkt.byteLength) {
                        case 9:
                            client.x = pkt.getInt32(1, true);
                            client.y = pkt.getInt32(5, true);
							break;
                    }
                    break;
            }
            if (client.server !== thisArg.url) {
                client.server = thisArg.url;
            }
			return res;
		}
	});
	window.addEventListener('load', () => {
		client = new User();
        document.addEventListener('keydown', client.keyDown.bind(client));
    });
} else {
    window.addEventListener("load", () => {
        const client = new User();
        document.addEventListener('keydown', client.keyDown.bind(client));

        WebSocket.prototype.realSend = WebSocket.prototype.send;
        WebSocket.prototype.send = function (pkt) {
            this.realSend(pkt);
            if (typeof pkt == 'string') return;
            if (this.url.includes('localhost')) return;
            if (pkt instanceof ArrayBuffer) pkt = new DataView(pkt);
            else if (pkt instanceof DataView) pkt = pkt;
            else pkt = new DataView(pkt.buffer);
            switch (pkt.getUint8(0, true)) {
                case 16:
                    switch (pkt.byteLength) {
                        case 13:
                            client.x = pkt.getUint32(1, true);
                            client.y = pkt.getUint32(5, true);
							break;
                        case 21:
                            client.x = pkt.getFloat64(1, true);
                            client.y = pkt.getFloat64(9, true);
                            break;
                    }
                    break;
            }
            if (client.server !== this.url) {
                client.server = this.url;
            }
        };
    });
}