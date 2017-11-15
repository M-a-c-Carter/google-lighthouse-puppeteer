class LighthousePuppeteer {
    constructor() {
        this.DEBUG_PORT = 9222;
        this.puppeteer = require('puppeteer');
        this.lightHouseBatch = require('lighthouse-batch');
        this.defaultOptions = {
            debugPort: this.DEBUG_PORT,
            lighthouse: {
                params: '',
                useGlobal: true,
                out: '/home/chrome/reports',
                html: true,
                verbose: false,
            },
            puppeteer: {
                args: []
            }
        };
        this.browser = null;
    }

    exec(modulePath, opts = {}) {
        return new Promise((resolveGlobal, reject) => {
            let options = Object.assign({}, this.defaultOptions, opts);
            options.puppeteer.args.push(`--remote-debugging-port=${options.debugPort}`);
            const testcase = typeof (modulePath) === 'object' ? modulePath : require(modulePath);
            if (typeof(testcase.connect) !== 'function') {
                console.log(`${modulePath}: Module incorrectly formatted. Module should have "connect" method!`);
                process.exit(-3);
            }
            if (typeof(testcase.getUrls) !== 'function') {
                console.log(`${modulePath}: Module incorrectly formatted. Module should have "getUrls" method!`);
                process.exit(-4);
            }
            this.puppeteer.launch(options.puppeteer)
                .then(testcase.connect)
                .then(b => new Promise((resolve) => {
                    this.browser = b;
                    resolve(b);
                }))
                .then(b => new Promise((resolve) => {
                    const lighthouseOptions = {
                        verbose: options.lighthouse.verbose,
                        sites: testcase.getUrls(),
                        html: options.lighthouse.html,
                        out: options.lighthouse.out,
                        useGlobal: options.lighthouse.useGlobal,
                        params: `--port ${options.debugPort} ${options.lighthouse.params}`,
                    };
                    this.lightHouseBatch(lighthouseOptions);
                    resolve(b);
                }))
                .then(b => b.close())
                .then(b => resolveGlobal)
                .catch((err) => {
                    this.browser && this.browser.close();
                    reject(err);
                });
        });
    }
}

module.exports = new LighthousePuppeteer();
