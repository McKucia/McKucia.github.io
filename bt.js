let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let progress = document.getElementById('progress');
let status = document.getElementById('status');
let loadingPopup = document.getElementById('loadingPopup');
let closeButton = document.getElementById('closeButton');
let orderButton = document.getElementById('order');
let progressContainer = document.getElementById('progressContainer');
let blur = document.getElementById('blur');
let process = document.getElementById('process');
let apetor = document.getElementById('apetor');

let namePop = document.getElementById('namePop');
let descriptionPop = document.getElementById('descriptionPop');
let imagePop = document.getElementById("imagePop");

var clicked = '';
var connected = false;

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
    if(!connected) {
        alert("Brak połączenia z urządzeniem");
        return;
    }

    send(clicked);
    progressContainer.classList.add("progressFocus");
    blur.classList.add("blur");
    process.classList.add("processOpen");

    removeOrAddClassProgress(true);

    setTimeout(() => {
        apetor.classList.add('apetorFadeIn');
    }, "3000");

    setTimeout(() => {
        apetor.classList.remove('apetorFadeIn');
        blur.classList.remove("blur");
        process.className = '';
        removeOrAddClassProgress(false);
        loadingPopup.classList.remove("loadingPopupOpen");
        progressContainer.classList.remove("progressFocus");
        imagePop.src = '';
        namePop.innerHTML = '';
        descriptionPop.innerHTML = '';
    }, "4300");

    clicked = '';
}

function close() {
    loadingPopup.classList.remove("loadingPopupOpen");
    clicked = '';
}

function removeOrAddClassProgress(add) {
    if (add == true) {
        switch (clicked) {
            case '1':progress.classList.add("progressAperol"); break;
            case '2': progress.classList.add("progressTomCollins"); break;
            case '3': progress.classList.add("progressRussian"); break;
            case '4': progress.classList.add("progressMojito"); break;
            case '5': progress.classList.add("progressLongIsland"); break;
            case '6': progress.classList.add("progressSex"); break;
            case '7': progress.classList.add("progressCosmopolitan"); break;
            case '8': progress.classList.add("progressJagerbomb"); break;
        }
    }
    else {
        progress.className = '';
    }
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
    status.innerHTML = "Brak połączenia";
    connected = false;
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
        filters: [{ services: [0xFFE0] }]
    }).
        then(device => {
            // log('Wybrane urządzenie: ' + device.name != null ? device.name : 'nieobsługiwane')
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
            log("Połączono z " + deviceCache.name);
            connected = true;
            characteristic.addEventListener('characteristicvaluechanged',
                handleCharacteristicValueChanged);
        });
}

function handleCharacteristicValueChanged(event) {
    let value = new TextDecoder().decode(event.target.value);
}

function log(message) {
    console.log(message);
    status.innerHTML = message;
}
