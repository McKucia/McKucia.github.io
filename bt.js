let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');

function make(drink) {
    send(drink);
}

connectButton.addEventListener('click', function () {
    connect();
});

disconnectButton.addEventListener('click', function () {
    disconnect();
});

function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
        then(device => connectDeviceAndCacheCharacteristic(device)).
        then(characteristic => startNotifications(characteristic)).
        catch(error => console.log(error));
}

function disconnect() {
    if (deviceCache) {
        deviceCache.removeEventListener('gattserverdisconnected',
            handleDisconnection);

        if (deviceCache.gatt.connected) {
            deviceCache.gatt.disconnect();
        }
        else {
            console.log('"' + deviceCache.name +
                '" bluetooth device is already disconnected');
        }
    }

    if (characteristicCache) {
        characteristicCache.removeEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
        characteristicCache = null;
    }

    deviceCache = null;
}

function send(data) {
    data = String(data);

    if (!data || !characteristicCache) {
        return;
    }

    writeToCharacteristic(characteristicCache, data);
}

function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
}

let deviceCache = null;

function requestBluetoothDevice() {
    return navigator.bluetooth.requestDevice({
        filters: [{ services: [0xFFE0] }],
    }).
        then(device => {
            deviceCache = device;
            deviceCache.addEventListener('gattserverdisconnected',
                handleDisconnection);

            return deviceCache;
        });
}

function handleDisconnection(event) {
    let device = event.target;

    connectDeviceAndCacheCharacteristic(device).
        then(characteristic => startNotifications(characteristic)).
        catch(error => console.log(error));
}


let characteristicCache = null;

function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    return device.gatt.connect().
        then(server => {
            return server.getPrimaryService(0xFFE0);
        }).
        then(service => {
            return service.getCharacteristic(0xFFE1);
        }).
        then(characteristic => {
            characteristicCache = characteristic;

            return characteristicCache;
        });
}

function startNotifications(characteristic) {
    return characteristic.startNotifications().
        then(() => {
            characteristic.addEventListener('characteristicvaluechanged',
                handleCharacteristicValueChanged);
        });
}

function handleCharacteristicValueChanged(event) {
    let value = new TextDecoder().decode(event.target.value);
}