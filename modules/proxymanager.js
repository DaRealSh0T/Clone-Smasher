import axios from 'axios';
import ProxyAgent from 'proxy-agent';
import * as fs from 'fs';

let allProxyAgents = [];
let proxyAgents = [];
export function getProxy() {
    if(proxyAgents.length == 0) proxyAgents = allProxyAgents;
    return proxyAgents.shift();
}

export function scrapeProxys(scrape) {
    return new Promise(async (resolve, reject) => {
        if (scrape) {
            let { data } = await axios.get('https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks4&timeout=10000&country=all').catch((err) => {
                console.log("Failed to fetch proxy api, falling back to file.");
                return { data: '' };
            });
            if (!data) return resolve(await scrapeProxys(false));
            let proxies = data.replace(/\r/g, '').split('\n');
            proxies.forEach(proxy => {
                allProxyAgents.push(new ProxyAgent(`socks4://${proxy}`));
            });
            console.log(`Got ${proxies.length} proxies!`);
            resolve(proxies);
        } else {
            fs.readFile('./proxies.txt', (err, data) => {
                let proxies = data.toString().replace(/\r/g, '').split('\n');
                proxies.forEach(proxy => {
                    allProxyAgents.push(new ProxyAgent(`socks4://${proxy}`));
                });
                console.log(`Got ${proxies.length} proxies!`);
                resolve(proxies);
            });
        }
    });
}