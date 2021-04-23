import { getProxy } from  "../proxyManager.js"
import { getConfig } from  "../../server.js"
import WebSocket from 'ws';
//import * as fs from 'fs';
/*IN WORK*/
class Bot {

	constructor(origin) {
        this.clientVersion = 126;
        this.key = 28233056;
        this.canSpawn = false;
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
                'Pragma': 'no-cache',
                'Origin': this.origin,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36'
            },
			agent: this.proxy//,
    //        rejectUnauthorized: false
		});
  //      console.log(this.proxy);
		this.ws.binaryType = 'nodebuffer';
		this.ws.onopen = this.onopen.bind(this);
		this.ws.onmessage = this.onmessage.bind(this);
		this.ws.onerror = this.onerror.bind(this);
		this.ws.onclose = this.onclose.bind(this);
	}

	onopen() {
		let inits = Buffer.alloc(5);
		inits.writeUInt8(254, 0);
		inits.writeUInt32LE(this.clientVersion, 1);
		this.send(inits);

		inits = Buffer.alloc(5);
		inits.writeUInt8(255, 0);
        inits.writeUInt32LE(this.key, 1);
		this.send(inits);

        inits = Buffer.alloc(2);
		inits.writeUInt8(253, 0);
        inits.writeUInt8(9, 1);
		this.send(inits);
        this.doFirstSpawn();
        
	//	this.spawn();
	}

    doFirstSpawn(){
        this.doSendNick();
        this.doSendPass();
        setTimeout(() => {
            this.sendChatLogin.bind(this);
            this.sendChatLogin.bind(this);
        }, 200);
        setInterval(() => {
		//	this.spawn.bind(this);
		}, 3000);
    }

    doSpectate(){
        this.sendPacket(1);
    }
    
    sendPacket(id) {
        //	if (id == 2) {console.log('sent 2');}
        //	if (id == 0) {console.log('sent 0');}
            //if (id == 1) {console.log('sent 1');}
      var ret = Buffer.alloc(1);
          ret.writeUint8(id,0);
           this.send(ret);
        }

    doSendNick(){
        let password = "";
        let teamcolor = "";
        let nick = Math.random().toString(36).slice(2) + "a" + ":::::" + password + ":::::" + teamcolor;
        var ret = Buffer.alloc(1 + 2 * nick.length);
		ret.writeUInt8(0, 0);
		var i = 0;
		for (; i < nick.length; ++i) {
			ret.writeUInt16LE(nick.charCodeAt(i),1 + 2 * i);
		}
		this.send(ret);
    }

    doSendPass() { //server pass
        //console.log('doSendPass', pass, isSocketOpen());
          let pass = '';
          var ret = Buffer.alloc(1 + 2 * pass.length);
          ret.writeUint8(77,0);
          var i = 0;
          for (; i < pass.length; ++i) {
              ret.writeUInt16LE(pass.charCodeAt(i),1 + 2 * i);
          }
         this.send(ret);
    }
    
    sendChatLogin(){
        let str = '***playerenter***';
        var msg = Buffer.alloc(2 + 2 * str.length);
         var offset = 0;
         msg.writeUint8(99,offset++);
         msg.writeUint8(0,offset++); // flags (0 for now)
         for (var i = 0; i < str.length; ++i) {
          msg.writeUInt16LE(str.charCodeAt(i), offset);
          offset += 2;
         }
        this.send(msg);
    }

	spawn() {
       // if(this.canSpawn){
        this.doSendNick();
      //  }
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

	onmessage({ data }) {
        let buffer = Buffer.from(data);
        let offset = 0;
        if (buffer[0] == 240) offset += 5;
        let opcode = buffer[offset++];
        switch (opcode) {
            case 20:
             console.log('bad connection (proxy)?');
              break;
            case 32:
                this.canSpawn = false;
              break;
            case 78:
                console.log('Server password missmatch');
              break;
            case 89:
                let reason = data.readUint8(offset,true);
                offset += 1;
                console.log('Proxy temp banned! ' + reason);
              break;
              case 91:
              
              break;
              case 92:
                console.log('Too many connections from one ip!');
              break;
              case 94:
                  console.log('Too many people using "clone smasher" nickname! cant spawn');
                break;
              case 97:
                  console.log('bot died?');
                  this.canSpawn = true;
                  break;
              case 110:
                  console.log('BOT THROWED ERROR!')
                  break;
              case 111:
                  console.log('died? 111');
                  break;
        }
    } //not needed at the moment

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

export { Bot };