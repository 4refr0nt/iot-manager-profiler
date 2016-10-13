/**
 *
 * IoT Manager
 * get/set profile
 *
 */
const fs = require('fs');
const read = require('read-file');
const config = require('./config');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const mqtt = require('mqtt');

const options = commandLineArgs([
    { name: 'get', alias: "g", type: String },
    { name: 'config', alias: "c", type: String },
    { name: 'set', alias: "s", type: String },
    { name: 'help', alias: "h" },
]);

const connect = config => {
    const { username, password, host, port } = config;
    return mqtt.connect(`mqtt://${host}:${port}`, {
        username,
        password,
        keepalive: 30,
        clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
        connectTimeout: 30 * 1000,
    });
};

var client;
var t;
var msg;

function doConnect() {
    console.log('profiler: connecting to ' + config.host + ' ...');
    client = connect(config);
}

function setTimeoutTimer() {
    t = setTimeout(function() {
        client.end();
        console.log('profiler: No answer from IoT Manager (timeout), exiting...');
    }, 10 * 1000);
}

function checkErrors(topic, message) {

    console.log('profiler: incoming message from ' + topic);

    if (topic === config.output) {
        client.end();
        clearTimeout(t);
    } else {
        // skip unknown messages
        return false;
    }
    try {
        msg = JSON.parse(message.toString());
    } catch (err) {
        console.log('profiler: Error parsing message, exiting...');
        return false;
    }
    if (!msg.result) {
        console.log('profiler: Error "result" key not found, exiting...');
        return false;
    }
    if (msg.result !== 200) {
        console.log('profiler: Error: ' + msg.result);
        if (msg.msg) {
            console.log('profiler: error message: ' + msg.msg);
        }
        if (msg.obj) {
            console.log('profiler: error object : ' + msg.obj);
        }
        return false;
    }
    console.log('profiler: received answer message, errors not found');
    return true;
}

function onMessageSet(topic, message) {
    if (!checkErrors(topic, message)) {
        return;
    }
    console.log('profiler: success.');
}

function onMessageGet(topic, message) {
    if (!checkErrors(topic, message)) {
        return;
    }
    if (!msg.profiles) {
        console.log('profiler: Error key "profiles" not found, exiting...');
        return;
    }
    if (!Array.isArray(msg.profiles)) {
        console.log('profiler: Error in profiles array');
    }

    var count = msg.profiles.length

    console.log('profiler: parsed profile(s): ' + count);

    if (count > 0) {
        console.log('profiler: saving profiles ... ');
        fs.writeFile(options.get, JSON.stringify(msg.profiles, null, ' '), (err) => {
            console.log('profiler: ' + ((err) ? err : 'all profiles saved to ' + options.get));
        });
    } else {
        console.log('profiler: nothing to save, exiting...');
    }

}
function loadFile() {
    console.log('profiler: Try loading ' + options.set);
    var msg;
    try {
       msg = read.sync(options.set, 'utf8');
    } catch (err) {
       console.log('profiler: Error loading JSON file: \n' + err);
       clearTimeout(t);
       client.end();
       return;
    }
    msg = '{ "profiles":' + msg + '}';
    try {
      msg = JSON.parse(msg);
    } catch (err) {
       console.log('profiler: Error parsing JSON file: \n' + err);
       clearTimeout(t);
       client.end();
       return;
    }
    console.log('profiler: file "' + options.set + '" loaded successfully');
    return msg.profiles;
}
if (options.get) {
    doConnect();
    client.on('message', onMessageGet);
    client.on('connect', () => {
        console.log('profiler: connected to broker');
        setTimeoutTimer();
        client.subscribe(config.output)
        client.publish(config.input, JSON.stringify({ cmd: 'GET' }));
        console.log('profiler: command GET sent, waiting for answer ...');
    });

} else if (options.set) {
    doConnect();
    client.on('message', onMessageSet);
    client.on('connect', () => {
        console.log('profiler: connected to broker');
        setTimeoutTimer();
        client.subscribe(config.output);

        var data = loadFile();
        if (!Array.isArray(data)) {
          console.log('profiler: Error: profiles in NOT array');
          clearTimeout(t);
          client.end();
          return;
        }
        var msg = { cmd: 'SET', data: data };
        // console.log(JSON.stringify(msg))        
        client.publish(config.input, JSON.stringify(msg));
        console.log('profiler: command SET sent, waiting for answer ...');
    });
} else {
    const sections = [{
        header: 'IoT manager profiles',
        content: 'get/set [italic]{profiles} from/to IoT Manager.'
    }, {
        header: 'Options',
        optionList: [{
            name: 'set',
            typeLabel: '[underline]{file.json}',
            description: 'node main.js  -c ./config  -s ./profiles/example1.json'
        }, {
            name: 'get',
            typeLabel: '[underline]{file.json}',
            description: 'node main.js  -c ./config  -g ./profiles/test.json'
        }, {
            name: 'config',
            typeLabel: '[underline]{file}',
            description: 'node main.js  -c ./config [-s|-g] file.json'
        }, {
            name: 'help',
            description: 'Print this usage guide.'
        }]
    }];
    const usage = getUsage(sections);
    console.log(usage);
}
