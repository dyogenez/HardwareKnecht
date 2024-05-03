let mediaRecorder;
let audioChunks = [];
let audioContext;
let analyser;
let dataArray;
let source;
let currentStream;

window.onload = function() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    .then(stream => {
        currentStream = stream; // Speichert den initialen Stream, stoppt diesen aber nicht
        setupDevices(); // Initialisiert Auswahlmöglichkeiten für Geräte
        setupAudioVisualizer(stream); // Audio-Visualizer Setup
    })
    .catch(error => {
        console.error('Fehler beim Zugriff auf Kamera und Mikrofon:', error);
    });
};

document.getElementById('startCamera').addEventListener('click', function() {
    updateVideoStream(); // Aktiviert die Kamera nur auf Knopfdruck
});

function showSection(sectionId) {
    const sections = document.querySelectorAll('.testSection');
    sections.forEach(section => {
        if (section.id !== sectionId) {
            section.classList.remove('show'); // Entferne die Klasse 'show' sofort
            setTimeout(() => {
                section.style.display = 'none'; // Verzögere das Ausblenden, um den Übergang zu ermöglichen
            }, 0); // Warte die Dauer der Opazitäts-Transition
        }
    });

    

    const activeSection = document.getElementById(sectionId);
    if (!activeSection.classList.contains('show')) {
        activeSection.style.display = 'block'; // Stelle sicher, dass der Bereich blockiert wird, bevor die Klasse 'show' hinzugefügt wird
        setTimeout(() => {
            activeSection.classList.add('show'); // Füge die Klasse 'show' hinzu, um den Bereich einzublenden
        }, 10); // Verzögere leicht, um CSS-Applikation zu erlauben
    }
}





function handleKeyDown(e) {
    const key = e.key.toUpperCase();
    const keyElement = document.querySelector(`.key[data-key="${key}"]`);
    if (keyElement) {
        keyElement.classList.add('active');
    }
}

// Rufe showSection initial auf, um den Start-Tab festzulegen
document.addEventListener('DOMContentLoaded', function() {
   
});

// Aktivierung der Kamera nur durch Button-Klick
document.getElementById('startCamera').addEventListener('click', function() {
    document.getElementById('cameraOutput').style.display = 'block'; // Stelle sicher, dass das Video-Element sichtbar ist
    updateVideoStream();
});


function setupDevices(stream) {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        const videoInput = devices.filter(device => device.kind === 'videoinput');
        const audioInput = devices.filter(device => device.kind === 'audioinput');

        const cameraSelect = document.getElementById('cameraSelect');
        cameraSelect.innerHTML = '';
        videoInput.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Kamera ${device.deviceId}`;
            cameraSelect.appendChild(option);
        });

        const microphoneSelect = document.getElementById('microphoneSelect');
        microphoneSelect.innerHTML = '';
        audioInput.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Mikrofon ${device.deviceId}`;
            microphoneSelect.appendChild(option);
        });

        cameraSelect.onchange = () => updateVideoStream();
        microphoneSelect.onchange = () => updateAudioInput();

    }).catch(error => {
        console.error('Fehler beim Laden der Geräteliste:', error);
    });
}

document.getElementById('startCamera').addEventListener('click', function() {
    updateVideoStream();
});

function updateVideoStream() {
    const cameraSelect = document.getElementById('cameraSelect');
    const videoOutput = document.getElementById('cameraOutput');
    const constraints = {
        video: {
            deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
            width: { exact: 640 },  // Festgelegte Breite
            height: { exact: 480 }  // Festgelegte Höhe
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        currentStream = stream;
        videoOutput.srcObject = currentStream;
        videoOutput.play();
    })
    .catch(error => {
        console.error('Fehler beim Zugriff auf die Kamera:', error);
    });
}


// Event Listener in JavaScript hinzufügen
document.getElementById('startCamera').addEventListener('click', updateVideoStream);






function updateAudioInput() {
    const microphoneSelect = document.getElementById('microphoneSelect');
    const constraints = { audio: { deviceId: microphoneSelect.value ? { exact: microphoneSelect.value } : undefined }};

    // Stelle sicher, dass alle bestehenden Tracks gestoppt werden, bevor du einen neuen Stream anforderst.
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        currentStream = stream; // Aktualisiere den aktuellen Stream
        if (source) {
            source.disconnect(); // Trenne die alte Quelle, falls vorhanden
        }
        setupAudioVisualizer(stream); // Setze den Audio Visualizer mit dem neuen Stream auf
    })
    .catch(error => {
        console.error('Fehler beim Zugriff auf das Mikrofon:', error);
    });
}



function setupAudioVisualizer(stream) {
    // Initialisiere oder benutze den bestehenden AudioContext
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    source = audioContext.createMediaStreamSource(stream); // Erstelle eine neue Quelle aus dem Stream
    if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
    }
    source.connect(analyser);
    updateVisualizer(); // Funktion, die den Visualizer aktualisiert
}


function updateVisualizer() {
    const canvas = document.getElementById('microphoneOutput');
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();

        let sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * canvas.height / 2;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    draw(); // Starte die Visualisierung
}

document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('keydown', function (e) {
        e.preventDefault();  // Verhindert Standardverhalten und Doppelbelegungen
        const keyElement = document.querySelector(`.key[data-key="${e.code}"]`);
        if (keyElement && !keyElement.classList.contains('active')) {
            keyElement.classList.add('active');  // Markiert die Taste
        }
    });
    // Kein 'keyup' Event zum Entfernen der Klasse, da Tasten markiert bleiben sollen
});

// Verwalte Tastaturereignisse nur, wenn der Tastatur-Tab aktiv ist
document.addEventListener('keydown', function(e) {
    if (currentTab !== 'keyboard') return; // Ignoriere Tastenanschläge, wenn nicht im Tastatur-Tab
    const keyElement = document.querySelector(`.key[data-key="${e.code}"]`);
    if (keyElement) keyElement.classList.add('active');
});


navigator.getBattery().then(function(battery) {
    function updateBatteryInfo() {
        document.getElementById('batteryLevel').textContent = (battery.level * 100).toFixed(0);
        document.getElementById('chargingStatus').textContent = battery.charging ? 'Ladend' : 'Nicht ladend';
        document.getElementById('chargingTime').textContent = battery.chargingTime ? battery.chargingTime + ' Minuten' : 'N/A';
        document.getElementById('dischargingTime').textContent = battery.dischargingTime ? battery.dischargingTime + ' Minuten' : 'N/A';
    }

    updateBatteryInfo();

    battery.addEventListener('chargingchange', function() {
        updateBatteryInfo();
    });
    battery.addEventListener('levelchange', function() {
        updateBatteryInfo();
    });
    battery.addEventListener('chargingtimechange', function() {
        updateBatteryInfo();
    });
    battery.addEventListener('dischargingtimechange', function() {
        updateBatteryInfo();
    });
});





function startRecording() {
    mediaRecorder = new MediaRecorder(currentStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };
    mediaRecorder.start();
    document.getElementById('stopRecording').disabled = false;
    document.getElementById('startRecording').disabled = true;
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { 'type': 'audio/ogg; codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = document.getElementById('audioOutput');
        audio.src = audioUrl;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('startRecording').disabled = false;
        audio.play(); // Starte die Wiedergabe der Aufnahme
        document.getElementById('audioOutput').style.display = 'block'; // Stelle sicher, dass der Audio-Player sichtbar ist
    };
}
