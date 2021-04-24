import axios from 'axios';
import ProxyAgent from 'proxy-agent';
import * as fs from 'fs';

let proxyAgents = [];
export function getProxy() {
    let proxy = proxyAgents.shift();
    proxyAgents.push(proxy);
    return proxy;
}

setInterval(() => {
    proxyAgents = proxyAgents.sort(() => Math.random() - 0.5)
}, 1e4);

export function scrapeProxys(scrape, proxyType) {
    return new Promise(async (resolve, reject) => {
        if (scrape) {
            let { data } = await axios.get(`https://api.proxyscrape.com/v2/?request=getproxies&protocol=${proxyType}&timeout=10000&country=all`).catch((err) => {
                console.log("Failed to fetch proxy api, falling back to file.");
                return { data: '' };
            });
            if (!data) return resolve(await scrapeProxys(false, proxyType));
            let proxies = data.replace(/\r/g, '').split('\n');
            proxies.forEach(proxy => {
                proxyAgents.push(new ProxyAgent(`${proxyType}://${proxy}`));
            });
            console.log(`Got ${proxies.length} proxies!`);
            resolve(proxies);
        } else {
            fs.readFile('./proxies.txt', (err, data) => {
                let proxies = data.toString().replace(/\r/g, '').split('\n');
                proxies.forEach(proxy => {
                    proxyAgents.push(new ProxyAgent(`${proxyType}://${proxy}`));
                });
                console.log(`Got ${proxies.length} proxies!`);
                resolve(proxies);
            });
        }
    });
}
