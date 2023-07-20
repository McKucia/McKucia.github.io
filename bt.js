let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let progress = document.getElementById('progress');
let status = document.getElementById('status');
let loadingPopup = document.getElementById('loadingPopup');
let closeButton = document.getElementById('closeButton');
let orderButton = document.getElementById('order');
let progressContainer = document.getElementById('progressContainer');

let namePop = document.getElementById('namePop');
let descriptionPop = document.getElementById('descriptionPop');
let imagePop = document.getElementById("imagePop");

var clicked = '';

function openPopup(element, drink) {
    clicked = drink;
    let name = element.childNodes[3].childNodes[1].innerHTML;
    let description = element.childNodes[3].childNodes[3].innerHTML;
    let imgSrc = element.childNodes[1].childNodes[1].src;

    imagePop.src = imgSrc;
    namePop.innerHTML = name;
    descriptionPop.innerHTML = description;

    loadingPopup.classList.add("loadingPopupOpen");
}

function make() {
    progressContainer.classList.add("progressFocus");
    switch (clicked) {
        case 'aperol':
            progress.classList.add("progressAperol");
            break;
        case 'tomcollins':
            progress.classList.add("progressTomCollins");
            break;
        case 'russian':
            progress.classList.add("progressRussian");
            break;
        case 'mojito':
            progress.classList.add("progressMojito");
            break;
    }
    clicked = '';
}

connectButton.addEventListener('click', function () {
    connect();
});

disconnectButton.addEventListener('click', function () {
    disconnect();
});

closeButton.addEventListener('click', function () {
    close();
});

orderButton.addEventListener('click', function () {
    make();
});

function close() {
    loadingPopup.classList.remove("loadingPopupOpen");
    clicked = '';
}

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
        acceptAllDevices: true
    }).
        then(device => {
            log('Wybrane urządzenie: ' + device.name != null ? device.name : 'nieobsługiwane')
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
            log('Udało się połączyć');
            characteristicCache = characteristic;

            return characteristicCache;
        });
}

function startNotifications(characteristic) {
    return characteristic.startNotifications().
        then(() => {
            log(deviceCache);
            characteristic.addEventListener('characteristicvaluechanged',
                handleCharacteristicValueChanged);
        });
}

function handleCharacteristicValueChanged(event) {
    let value = new TextDecoder().decode(event.target.value);
}

function log(message) {
    status.innerHTML = message;
}