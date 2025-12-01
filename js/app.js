// Main application logic

let uploadedFile = null;
let parsedData = null;
let generatedFiles = [];

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileDetails = document.getElementById('fileDetails');
const processBtn = document.getElementById('processBtn');
const progressArea = document.getElementById('progressArea');
const progressFill = document.getElementById('progressFill');
const statusMessage = document.getElementById('statusMessage');
const results = document.getElementById('results');
const resultsList = document.getElementById('resultsList');
const errorMessage = document.getElementById('errorMessage');

// Event listeners
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
        handleFile(file);
    } else {
        showError('Please upload a CSV file');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

processBtn.addEventListener('click', processFile);

function handleFile(file) {
    uploadedFile = file;
    fileName.textContent = `📄 ${file.name}`;
    fileDetails.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
    fileInfo.classList.add('show');
    document.getElementById('caprosterSection').classList.add('show');
    processBtn.classList.add('show');
    results.classList.remove('show');
    errorMessage.classList.remove('show');
    
    // Parse CSV for validation
    Papa.parse(file, {
        header: true,
        delimiter: "",
        skipEmptyLines: true,
        complete: function(results) {
            parsedData = results.data.filter(row => {
                return row['Route Code'] && row['Route Code'].trim() && 
                       row['Dispatch Time'] && row['Dispatch Time'].trim();
            });
        }
    });
}

function processFile() {
    if (!uploadedFile) return;

    // Validate Caproster if data provided
    const caprosterInput = document.getElementById('caprosterInput');
    if (caprosterInput.value.trim()) {
        const validation = validateCaproster();
        if (!validation.isValid && validation.differences.length > 0) {
            const confirmed = confirm(`⚠️ Warning: ${validation.differences.length} time difference(s) found between DEPART and Caproster!\n\nDo you want to continue generating files anyway?\n\nClick OK to continue or Cancel to review the differences.`);
            if (!confirmed) return;
        }
    }

    processBtn.disabled = true;
    progressArea.classList.add('show');
    results.classList.remove('show');
    errorMessage.classList.remove('show');
    generatedFiles = [];

    updateProgress(10, 'Reading CSV file...');

    Papa.parse(uploadedFile, {
        header: true,
        delimiter: "",
        skipEmptyLines: true,
        complete: function(parseResults) {
            try {
                parsedData = parseResults.data.filter(row => {
                    return row['Route Code'] && row['Route Code'].trim() && 
                           row['Dispatch Time'] && row['Dispatch Time'].trim();
                });
                
                if (parsedData.length === 0) {
                    showError('No valid data found in CSV. Please check the file format.');
                    processBtn.disabled = false;
                    progressArea.classList.remove('show');
                    return;
                }
                
                console.log('First parsed row:', parsedData[0]);
                console.log('Total rows:', parsedData.length);
                
                updateProgress(30, 'Processing data...');
                
                setTimeout(() => {
                    generateAllFiles();
                }, 500);
            } catch (error) {
                showError('Error processing file: ' + error.message);
                processBtn.disabled = false;
                progressArea.classList.remove('show');
            }
        },
        error: function(error) {
            showError('Error reading CSV: ' + error.message);
            processBtn.disabled = false;
            progressArea.classList.remove('show');
        }
    });
}

function generateAllFiles() {
    try {
        const uniqueDispatchTimes = [...new Set(parsedData.map(row => row['Dispatch Time']))].sort();
        
        const dataByDSP = {};
        const dataByWave = {};
        const waveTimings = {};
        
        parsedData.forEach(row => {
            const dsp = row['Driver'].replace('DSP:', '').trim();
            const dispatchTime = row['Dispatch Time'];
            const wave = getWaveNumber(dispatchTime, uniqueDispatchTimes);
            
            if (!dataByDSP[dsp]) {
                dataByDSP[dsp] = [];
            }
            dataByDSP[dsp].push(row);
            
            if (!dataByWave[wave]) {
                dataByWave[wave] = [];
                waveTimings[wave] = calculateWaveTiming(dispatchTime);
            }
            dataByWave[wave].push(row);
        });

        updateProgress(50, 'Generating Wave Plan PDF...');
        
        setTimeout(() => {
            generateWavePlanPDF(dataByWave, waveTimings);
            
            updateProgress(70, 'Generating Staging Plan PDF...');
            
            setTimeout(() => {
                generateStagingPlanPDF(parsedData);
                
                updateProgress(85, 'Generating Excel files for each DSP...');
                
                setTimeout(() => {
                    generateDSPExcelFiles(dataByDSP);
                    
                    updateProgress(100, 'Complete! All files generated.');
                    
                    setTimeout(() => {
                        displayResults();
                        processBtn.disabled = false;
                    }, 500);
                }, 500);
            }, 500);
        }, 500);
        
    } catch (error) {
        showError('Error generating files: ' + error.message);
        processBtn.disabled = false;
        progressArea.classList.remove('show');
    }
}

function displayResults() {
    resultsList.innerHTML = '';
    
    const actionButtonsDiv = document.createElement('div');
    actionButtonsDiv.className = 'action-buttons';
    
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.className = 'download-all-btn';
    downloadAllBtn.textContent = '⬇️ Download All Files';
    downloadAllBtn.onclick = downloadAllFiles;
    
    const chimeAllBtn = document.createElement('button');
    chimeAllBtn.className = 'chime-all-btn';
    chimeAllBtn.textContent = '📢 Send Chime to All';
    chimeAllBtn.onclick = sendChimeToAll;
    
    actionButtonsDiv.appendChild(downloadAllBtn);
    actionButtonsDiv.appendChild(chimeAllBtn);
    resultsList.appendChild(actionButtonsDiv);
    
    const emailAllBtn = document.createElement('button');
    emailAllBtn.className = 'email-all-btn';
    emailAllBtn.textContent = '📧 Create All Email Drafts';
    emailAllBtn.onclick = createAllEmailDrafts;
    resultsList.appendChild(emailAllBtn);
    
    generatedFiles.forEach((file) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const resultName = document.createElement('div');
        resultName.className = 'result-name';
        resultName.textContent = file.name;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.flexWrap = 'wrap';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = '⬇️ Download';
        downloadBtn.onclick = () => downloadFile(file.blob, file.name);
        
        buttonContainer.appendChild(downloadBtn);
        
        if (file.name.includes('Staging_Plan_') && file.name.endsWith('.xlsx')) {
            const match = file.name.match(/Staging_Plan_(.+?)_/);
            if (match) {
                const dsp = match[1];
                
                const emailBtn = document.createElement('button');
                emailBtn.className = 'email-btn';
                emailBtn.textContent = '📧 Email';
                emailBtn.onclick = () => {
                    createEmailDraft(dsp);
                };
                buttonContainer.appendChild(emailBtn);
                
                const chimeBtn = document.createElement('button');
                chimeBtn.className = 'chime-btn';
                chimeBtn.textContent = '📢 Chime';
                chimeBtn.onclick = async () => {
                    chimeBtn.disabled = true;
                    chimeBtn.textContent = 'Sending...';
                    await sendChimeNotification(dsp, true);
                    chimeBtn.disabled = false;
                    chimeBtn.textContent = '📢 Chime';
                    alert(`📢 Chime notification sent to ${dsp}!\n📥 File downloaded.\n\n⚠️ Note: Check Chime to confirm delivery (browser can't verify due to security).`);
                };
                buttonContainer.appendChild(chimeBtn);
            }
        }
        
        resultItem.appendChild(resultName);
        resultItem.appendChild(buttonContainer);
        resultsList.appendChild(resultItem);
    });
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.textContent = '🔄 Process Another File';
    resetBtn.onclick = resetApp;
    resultsList.appendChild(resetBtn);
    
    results.classList.add('show');
}

function resetApp() {
    uploadedFile = null;
    parsedData = null;
    generatedFiles = [];
    fileInput.value = '';
    fileInfo.classList.remove('show');
    processBtn.classList.remove('show');
    progressArea.classList.remove('show');
    results.classList.remove('show');
    errorMessage.classList.remove('show');
    progressFill.style.width = '0%';
}
