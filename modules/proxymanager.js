import Request from 'request';
import ProxyAgent from 'proxy-agent';
import * as fs from 'fs';

let allProxyAgents = [];
let proxyAgents = [];
export function getProxy() {
    if(proxyAgents.length == 0) proxyAgents = allProxyAgents;
    return proxyAgents.shift();
}

export function scrapeProxys(scrape) {
    if(scrape) {
        Request('https://www.proxy-list.download/api/v1/get?type=socks5', (err, req, body) => {
            let proxies = body.replace(/\r/g, '').split('\n');
            proxies.forEach(proxy => {
                allProxyAgents.push(new ProxyAgent(`socks://${proxy}`));
            });
            console.log(`Got ${proxies.length} proxies!`);
        });
    } else {
        fs.readFile('./proxies.txt', (err, data) => {
            let proxies = data.toString().replace(/\r/g, '').split('\n');
            proxies.forEach(proxy => {
                allProxyAgents.push(new ProxyAgent(`socks://${proxy}`));
            });
            console.log(`Got ${proxies.length} proxies!`);
        });
    }
}