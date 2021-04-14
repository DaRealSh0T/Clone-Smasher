const request = require('request');
const proxyAgent = require('proxy-agent');

let allProxyAgents = [];
let proxyAgents = [];

exports.getProxy = function() {
	if (proxyAgents.length == 0) proxyAgents = allProxyAgents;
	return proxyAgents.shift();
}

exports.scrapeProxys = function(scrape) {
	if (scrape) {
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