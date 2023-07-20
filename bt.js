let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');

connectButton.addEventListener('click', function () {
    connect();
});

disconnectButton.addEventListener('click', function () {
    disconnect();
});

sendForm.addEventListener('submit', function (event) {
    event.preventDefault();
    send(inputField.value);
    inputField.value = '';
    inputField.focus();
});

function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
        then(device => connectDeviceAndCacheCharacteristic(device)).
        then(characteristic => startNotifications(characteristic)).
        catch(error => log(error));
}

function disconnect() {
    if (deviceCache) {
        log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
        deviceCache.removeEventListener('gattserverdisconnected',
            handleDisconnection);

        if (deviceCache.gatt.connected) {
            deviceCache.gatt.disconnect();
            log('"' + deviceCache.name + '" bluetooth device disconnected');
        }
        else {
            log('"' + deviceCache.name +
                '" bluetooth device is already disconnected');
        }
    }

    // Added condition
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
    log(data, 'out');
}

function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
}

function log(data, type = '') {
    terminalContainer.insertAdjacentHTML('beforeend',
        '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}


let deviceCache = null;

function requestBluetoothDevice() {
    log('Requesting bluetooth device...');

    return navigator.bluetooth.requestDevice({
        filters: [{ services: [0xFFE0] }],
    }).
        then(device => {
            log('"' + device.name + '" bluetooth device selected');
            deviceCache = device;

            // Added line
            deviceCache.addEventListener('gattserverdisconnected',
                handleDisconnection);

            return deviceCache;
        });
}

function handleDisconnection(event) {
    let device = event.target;

    log('"' + device.name +
        '" bluetooth device disconnected, trying to reconnect...');

    connectDeviceAndCacheCharacteristic(device).
        then(characteristic => startNotifications(characteristic)).
        catch(error => log(error));
}


let characteristicCache = null;

function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    log('Connecting to GATT server...');

    return device.gatt.connect().
        then(server => {
            log('GATT server connected, getting service...');

            return server.getPrimaryService(0xFFE0);
        }).
        then(service => {
            log('Service found, getting characteristic...');

            return service.getCharacteristic(0xFFE1);
        }).
        then(characteristic => {
            log('Characteristic found');
            characteristicCache = characteristic;

            return characteristicCache;
        });
}

function startNotifications(characteristic) {
    log('Starting notifications...');

    return characteristic.startNotifications().
        then(() => {
            log('Notifications started');
            // Added line
            characteristic.addEventListener('characteristicvaluechanged',
                handleCharacteristicValueChanged);
        });
}

function handleCharacteristicValueChanged(event) {
    let value = new TextDecoder().decode(event.target.value);
    log(value, 'in');
}