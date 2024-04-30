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

    if (currentStream) {
        // Vor dem Neustarten des Streams werden alle alten Tracks gestoppt.
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: { deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined }
    };

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        currentStream = stream;
        videoOutput.srcObject = currentStream;
        videoOutput.play();
    })
    .catch(error => {
        console.error('Fehler beim Zugriff auf die Kamera:', error);
    });
}






function updateAudioInput() {
    const microphoneSelect = document.getElementById('microphoneSelect');
    const constraints = { audio: { deviceId: microphoneSelect.value ? { exact: microphoneSelect.value } : undefined } };
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        currentStream = stream;
        if (source) {
            source.disconnect();
        }
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
    })
    .catch(error => {
        console.error('Fehler beim Zugriff auf das Mikrofon:', error);
    });
}

function setupAudioVisualizer(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    const canvas = document.getElementById('microphoneOutput');
    const canvasCtx = canvas.getContext('2d');

    if (source) {
        source.disconnect();
    }
    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

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
        for(let i = 0; i < bufferLength; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * canvas.height / 2;
            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }
    draw();
}

function startRecording() {
    mediaRecorder = new MediaRecorder(currentStream);
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
        const audioBlob = new Blob(audioChunks, { 'type' : 'audio/ogg; codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = document.getElementById('audioOutput');
        audio.src = audioUrl;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('startRecording').disabled = false;
        audioChunks = [];
    };
}
