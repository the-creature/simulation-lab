exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: [
        'e2e/*.js'
    ],
    multiCapabilities: [{
        browserName: 'chrome'
    }/*, {
        browserName: 'firefox'
    }, {
        browserName: 'safari'
    }*/],

    // The timeout in milliseconds for each script run on the browser.
    allScriptsTimeout: 600000,

    // How long to wait for a page to load.
    getPageTimeout: 600000,

    // Options to be passed to Jasmine-node.
    jasmineNodeOpts: {
        showColors: true, // Use colors in the command line report.
    }
};