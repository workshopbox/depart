// Utility functions

function getWaveNumber(dispatchTime, uniqueTimes) {
    return uniqueTimes.indexOf(dispatchTime) + 1;
}

function calculateWaveTiming(dispatchTime) {
    const [hour, minute] = dispatchTime.split(':').map(Number);
    
    // Dispatch Time IS the Loading time
    const loading = dispatchTime.trim();
    
    // Arrival is 20 minutes BEFORE loading
    const arrivalDate = new Date(2000, 0, 1, hour, minute - 20);
    const arrival = `${String(arrivalDate.getHours()).padStart(2, '0')}:${String(arrivalDate.getMinutes()).padStart(2, '0')}`;
    
    // Leaving starts 15 minutes after loading
    const leavingDate = new Date(2000, 0, 1, hour, minute + 15);
    const leaving = `${String(leavingDate.getHours()).padStart(2, '0')}:${String(leavingDate.getMinutes()).padStart(2, '0')}`;
    
    // Yard empty 5 minutes after leaving (or 20 minutes after loading)
    const yardEmptyDate = new Date(2000, 0, 1, hour, minute + 20);
    const yardEmpty = `${String(yardEmptyDate.getHours()).padStart(2, '0')}:${String(yardEmptyDate.getMinutes()).padStart(2, '0')}`;
    
    return { arrival, loading, leaving, yardEmpty };
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadAllFiles() {
    generatedFiles.forEach((file, index) => {
        setTimeout(() => {
            downloadFile(file.blob, file.name);
        }, index * 200);
    });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function updateProgress(percent, message) {
    progressFill.style.width = percent + '%';
    progressFill.textContent = percent + '%';
    statusMessage.textContent = message;
}

function showError(message) {
    errorMessage.textContent = '❌ ' + message;
    errorMessage.classList.add('show');
}
