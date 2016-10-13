# IoT Manager profiler

Load and save profiles from/to mobile devices via MQTT.


[IoT Manager for iOS](https://itunes.apple.com/us/app/iot-manager/id1155934877)

[IoT Manager for Android](https://play.google.com/store/apps/details?id=ru.esp8266.iotmanager)


=======================================================

## Requirements

Install [NodeJS 6.X.X and above](https://nodejs.org)

## Before run

```
cd iot-manager-profiler
npm i
```
Then edit `config.js`: mqtt host, port, username and password

## Run


### Get profiles from IoT Manager

- 1. Run IoT Manager and connect to broker (app must be always in foreground)
- 2. run `iotm-profiler` by typing command:


```
node main.js  -c ./config  -g ./profiles/test.json
```

You see log:


```
profiler: connecting to 192.168.1.135 ...
profiler: connected to broker
profiler: command GET sent, waiting for answer ...
profiler: incoming message from /IoTmanager/exchange/output
profiler: received answer message, errors not found
profiler: parsed profile(s): 1
profiler: saving profiles ...
profiler: all profiles saved to ./profiles/test.json
```

Then expect `./profiles/test.json`



### Set profiles to IoT Manager

- 1. Run IoT Manager and connect to broker (app must be always in foreground)
- 2. run `iotm-profiler` by typing command:

```
node main.js  -c ./config  -s ./profiles/example1.json
```

You see log:

```
profiler: connecting to 192.168.1.135 ...
profiler: connected to broker
profiler: Try loading ./profiles/example1.json
profiler: file "./profiles/example1.json" loaded successfully
profiler: command SET sent, waiting for answer ...
profiler: incoming message from /IoTmanager/exchange/output
profiler: received answer message, errors not found
profiler: success.
```

- 3. On your phone you will see dialog "Load profiles?" - click "Yes"


## License


MIT
