let uploadedFile = null;
let parsedData = null;
let generatedFiles = [];

// Chime webhook URLs for each DSP
const chimeWebhooks = {
    'ABFB': 'https://hooks.chime.aws/incomingwebhooks/cfbdc936-2e02-443a-8606-d55dfb0d500e?token=RjRBWGF3SVN8MXxld19ZMWpaWGd4YzdfcVZuMHRremI1ODVhU2JyaFVaMTh1VWktTzlaMXlV',
    'AMTP': 'https://hooks.chime.aws/incomingwebhooks/07b12ac5-055e-48d9-a9db-dfa6c189ce01?token=YWJGcGRCV298MXxfc09OYmlCajBta0Fkek1qaTJGVlQwUDVsaUswTTlhaDJyd1N1eVZZOF9r',
    'BBGH': 'https://hooks.chime.aws/incomingwebhooks/0299bc4f-a193-42d2-8a28-f2bfeb8fd2e3?token=d1NBSlVjTG18MXxTOU5EU2NCXzlhek5ibktRTkxORDJGVEpBQkxfQVpFNExrdVMtNmxZSHU0',
    'MDTR': 'https://hooks.chime.aws/incomingwebhooks/2761601c-8b7a-417f-9dc7-913e203776d5?token=RlZ1UTA0dWJ8MXxvYzdqekJNYUZaM3Bad0hiN1BsQVN2QXV5eTlKSHh5bmR5S0RLTS1Ia0FF',
    'NALG': 'https://hooks.chime.aws/incomingwebhooks/2fa4330f-08a9-40cd-99e9-355789853f3c?token=STZ6Y1Q5bzN8MXxDd2VualdoSDRJajN4UnBxQVNjSFoyUDJnSWgwUWZPSklBWGVBZGRqTnB3',
    'FULL_TABLE': 'https://hooks.chime.aws/incomingwebhooks/db700da7-5ae7-4b47-b018-f5d7cf69b5c5?token=b25QTmxUbUp8MXxvY2ctNG5teW1URktIMkN4eWdsSm9QVWMzd0hoRWo5dF8zTmEzUFdUVWVj'
};

// Email addresses for each DSP
const dspEmails = {
    'ABFB': 'dap8-dispatcher@albatros-express.at',
    'AMTP': 'dap8-dispatcher@allmuna.at',
    'BBGH': 'dap8-dispatcher@baba-trans.at',
    'MDTR': 'mdtransportlanzmaier@gmail.com',
    'NALG': 'dap8-dispatcher@niazipaketlogistik.at',
    'FULL_TABLE': 'at-amzl-dap8@amazon.com'
};

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

// Upload area click
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop handlers
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

// File input change
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// Process button click
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
    
    // Parse CSV immediately for validation
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

function updateProgress(percent, message) {
    progressFill.style.width = percent + '%';
    progressFill.textContent = percent + '%';
    statusMessage.textContent = message;
}

function showError(message) {
    errorMessage.textContent = '❌ ' + message;
    errorMessage.classList.add('show');
}

function parseCaprosterData(caprosterText) {
    const lines = caprosterText.trim().split('\n');
    const caprosterMap = {};
    
    if (lines.length === 0) return caprosterMap;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split by tab (most common in Caproster)
        let parts = line.split('\t');
        
        if (parts.length >= 6) {
            // Format: DA_ID, Name, Status, Type, Duration, START_TIME, END_TIME, ..., DSP
            const daID = parts[0].trim().replace(/"/g, '');
            const startTime = parts[5].trim().replace(/"/g, ''); // Column 6 is start time
            
            // Validate DA ID starts with 'A' and time is in format "HH:MM am/pm"
            if (daID.startsWith('A') && startTime) {
                // Convert "8:40 am" to "08:40"
                let convertedTime = startTime.toLowerCase().replace(/\s+/g, '');
                
                // Parse time with am/pm
                const timeMatch = convertedTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
                if (timeMatch) {
                    let hour = parseInt(timeMatch[1]);
                    const minute = timeMatch[2];
                    const period = timeMatch[3];
                    
                    // Convert to 24-hour format
                    if (period === 'pm' && hour !== 12) {
                        hour += 12;
                    } else if (period === 'am' && hour === 12) {
                        hour = 0;
                    }
                    
                    const time24 = `${hour.toString().padStart(2, '0')}:${minute}`;
                    caprosterMap[daID] = time24;
                }
            }
        }
    }
    
    return caprosterMap;
}

function validateCaproster() {
    const caprosterInput = document.getElementById('caprosterInput');
    const validationResults = document.getElementById('validationResults');
    const caprosterText = caprosterInput.value.trim();
    
    if (!caprosterText) {
        validationResults.classList.remove('show');
        return { isValid: true, differences: [] };
    }
    
    if (!parsedData || parsedData.length === 0) {
        return { isValid: true, differences: [] };
    }
    
    const caprosterMap = parseCaprosterData(caprosterText);
    
    if (Object.keys(caprosterMap).length === 0) {
        validationResults.innerHTML = `
            <div class="validation-header warning">⚠️ Could not parse Caproster data</div>
            <div class="validation-summary">
                <p>Please check the format. Expected tab-separated with DA ID in first column and start time.</p>
                <p>Example: A3PHY1U4CQJ7F [tab] Name [tab] ... [tab] 8:40 am</p>
            </div>
        `;
        validationResults.classList.add('show');
        return { isValid: false, differences: [] };
    }
    
    const differences = [];
    
    parsedData.forEach(row => {
        const routeCode = row['Route Code'];
        const daID = row['Type']; // DA ID is in Type column
        const departDispatchTime = row['Dispatch Time'];
        const caprosterStartZeit = caprosterMap[daID]; // Match by DA ID
        
        if (caprosterStartZeit && departDispatchTime.trim() !== caprosterStartZeit.trim()) {
            const dsp = row['Driver'].replace('DSP:', '').trim();
            differences.push({
                routeCode: routeCode,
                daID: daID,
                departTime: departDispatchTime.trim(),
                caprosterTime: caprosterStartZeit.trim(),
                location: row['Location'],
                dsp: dsp
            });
        }
    });
    
    if (differences.length === 0) {
        validationResults.innerHTML = `
            <div class="validation-header success">✅ Validation Successful</div>
            <div class="validation-summary">
                <p><strong>All times match!</strong></p>
                <p>Compared ${Object.keys(caprosterMap).length} DA IDs from Caproster. No discrepancies found.</p>
            </div>
        `;
        validationResults.classList.add('show');
        return { isValid: true, differences: [] };
    } else {
        let differencesHTML = differences.map(diff => `
            <div class="difference-item">
                <strong>${diff.routeCode}</strong> (DA ID: ${diff.daID}) - ${diff.location} (${diff.dsp})
                <div class="difference-details">
                    <div>📦 DEPART Dispatch Time: <strong>${diff.departTime}</strong></div>
                    <div>🕒 Caproster Start Zeit: <strong>${diff.caprosterTime}</strong></div>
                </div>
            </div>
        `).join('');
        
        validationResults.innerHTML = `
            <div class="validation-header warning">⚠️ Time Differences Found</div>
            <div class="validation-summary">
                <p><strong>${differences.length} route(s) have different times:</strong></p>
            </div>
            ${differencesHTML}
            <div class="validation-summary" style="margin-top: 15px;">
                <p><strong>⚠️ Please review these differences before generating files!</strong></p>
                <button onclick="notifyDSPsAboutDifferences()" class="chime-btn" style="width: 100%; margin-top: 15px; padding: 15px;">
                    📢 Send Chime to Affected DSPs
                </button>
            </div>
        `;
        validationResults.classList.add('show');
        
        // Store differences globally for Chime function
        window.timeDifferences = differences;
        
        return { isValid: false, differences: differences };
    }
}

async function notifyDSPsAboutDifferences() {
    if (!window.timeDifferences || window.timeDifferences.length === 0) {
        alert('No time differences to notify about.');
        return;
    }
    
    // Group differences by DSP
    const dspDifferences = {};
    window.timeDifferences.forEach(diff => {
        if (!dspDifferences[diff.dsp]) {
            dspDifferences[diff.dsp] = [];
        }
        dspDifferences[diff.dsp].push(diff);
    });
    
    const affectedDSPs = Object.keys(dspDifferences);
    
    if (!confirm(`Send Chime notifications to ${affectedDSPs.length} DSP(s): ${affectedDSPs.join(', ')}?`)) {
        return;
    }
    
    // Send Chime to each affected DSP
    for (const dsp of affectedDSPs) {
        const webhook = chimeWebhooks[dsp];
        
        if (!webhook) {
            console.log(`No webhook for ${dsp}`);
            continue;
        }
        
        const diffs = dspDifferences[dsp];
        const today = new Date().toLocaleDateString('en-GB');
        
        // Build message with all differences for this DSP
        let message = `⚠️ DEPART Time Differences Alert - ${today}\n\n`;
        message += `Hi ${dsp},\n\n`;
        message += `The following route(s) have different start times between DEPART and Caproster:\n\n`;
        
        diffs.forEach(diff => {
            message += `• ${diff.routeCode} (${diff.location})\n`;
            message += `  DA ID: ${diff.daID}\n`;
            message += `  DEPART: ${diff.departTime}\n`;
            message += `  Caproster: ${diff.caprosterTime}\n\n`;
        });
        
        message += `Please verify which time is correct before dispatching.\n`;
        
        try {
            await fetch(webhook, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Content: message
                })
            });
            
            console.log(`✅ Chime sent to ${dsp}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between sends
            
        } catch (error) {
            console.error(`Error sending to ${dsp}:`, error);
        }
    }
    
    alert(`📢 Chime notifications sent to ${affectedDSPs.length} DSP(s):\n${affectedDSPs.join('\n')}\n\n⚠️ Note: Please check Chime to confirm delivery.`);
}

// Auto-validate when Caproster input changes
document.addEventListener('DOMContentLoaded', () => {
    const caprosterInput = document.getElementById('caprosterInput');
    let validationTimeout;
    caprosterInput.addEventListener('input', () => {
        clearTimeout(validationTimeout);
        validationTimeout = setTimeout(() => {
            if (caprosterInput.value.trim() && parsedData) {
                validateCaproster();
            }
        }, 1000);
    });
});

function processFile() {
    if (!uploadedFile) return;

    // Validate Caproster if data is provided
    const caprosterInput = document.getElementById('caprosterInput');
    if (caprosterInput.value.trim()) {
        const validation = validateCaproster();
        
        if (!validation.isValid && validation.differences.length > 0) {
            const confirmed = confirm(
                `⚠️ Warning: ${validation.differences.length} time difference(s) found between DEPART and Caproster!\n\n` +
                `Do you want to continue generating files anyway?\n\n` +
                `Click OK to continue or Cancel to review the differences.`
            );
            
            if (!confirmed) {
                return;
            }
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
        delimiter: "",  // Auto-detect delimiter (comma, tab, etc.)
        skipEmptyLines: true,
        complete: function(parseResults) {
            try {
                // Filter out empty rows and rows without Route Code
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
                
                // Debug: Log the first row to see what we're getting
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
        // Extract unique dispatch times and sort them (earliest first)
        const uniqueDispatchTimes = [...new Set(parsedData.map(row => row['Dispatch Time']))].sort();
        
        // Extract data structure
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

function getWaveNumber(dispatchTime, uniqueTimes) {
    return uniqueTimes.indexOf(dispatchTime) + 1;
}

function calculateWaveTiming(dispatchTime) {
    const [hour, minute] = dispatchTime.split(':').map(Number);
    
    // Dispatch Time is the LOADING time
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

function generateWavePlanPDF(dataByWave, waveTimings) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); // Landscape for more width
    
    doc.setFontSize(20);
    doc.text('Wave Plan Yard Marshall Cycle1', 14, 20);
    
    const tableData = [];
    const waves = Object.keys(dataByWave).sort((a, b) => parseInt(a) - parseInt(b));
    
    waves.forEach(wave => {
        const timing = waveTimings[wave];
        const dspCounts = {};
        
        dataByWave[wave].forEach(row => {
            const dsp = row['Driver'].replace('DSP:', '').trim();
            dspCounts[dsp] = (dspCounts[dsp] || 0) + 1;
        });
        
        const rowData = [
            wave,
            timing.arrival,
            timing.loading,
            timing.leaving,
            timing.yardEmpty,
            dspCounts['NALG'] || '',
            dspCounts['AMTP'] || '',
            dspCounts['BBGH'] || '',
            dspCounts['MDTR'] || '',
            dspCounts['ABFB'] || '',
            '...',
            Object.values(dspCounts).reduce((a, b) => a + b, 0)
        ];
        
        tableData.push(rowData);
    });
    
    // Add totals row
    const totals = ['Total', '', '', '', ''];
    ['NALG', 'AMTP', 'BBGH', 'MDTR', 'ABFB'].forEach(dsp => {
        let total = 0;
        tableData.forEach(row => {
            const idx = ['NALG', 'AMTP', 'BBGH', 'MDTR', 'ABFB'].indexOf(dsp) + 5;
            total += parseInt(row[idx]) || 0;
        });
        totals.push(total);
    });
    totals.push('...');
    const grandTotal = totals.slice(5, 10).reduce((a, b) => a + b, 0);
    totals.push(grandTotal);
    tableData.push(totals);
    
    doc.autoTable({
        head: [['Wave', 'Arrival', 'Loading', 'Leaving', 'Yard Empty', 'NALG', 'AMTP', 'BBGH', 'MDTR', 'ABFB', '...', 'Sum']],
        body: tableData,
        startY: 30,
        styles: { 
            fontSize: 10, 
            cellPadding: 3,
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 15 },  // Wave
            1: { cellWidth: 20 },  // Arrival
            2: { cellWidth: 20 },  // Loading
            3: { cellWidth: 20 },  // Leaving
            4: { cellWidth: 25 },  // Yard Empty
            5: { cellWidth: 20 },  // NALG
            6: { cellWidth: 20 },  // AMTP
            7: { cellWidth: 20 },  // BBGH
            8: { cellWidth: 20 },  // MDTR
            9: { cellWidth: 20 },  // ABFB
            10: { cellWidth: 15 }, // ...
            11: { cellWidth: 20 }  // Sum
        },
        willDrawCell: function(data) {
            // Apply colors only to header cells for DSP columns
            if (data.section === 'head' && data.column.index >= 5 && data.column.index <= 9) {
                const dspColors = {
                    5: [255, 255, 0],    // NALG - Yellow
                    6: [255, 0, 255],     // AMTP - Magenta
                    7: [0, 128, 255],     // BBGH - Blue
                    8: [255, 165, 0],     // MDTR - Orange
                    9: [0, 255, 0]        // ABFB - Green
                };
                
                const color = dspColors[data.column.index];
                doc.setFillColor(color[0], color[1], color[2]);
            } else if (data.section === 'head') {
                // Other header cells stay gray
                doc.setFillColor(100, 100, 100);
            }
        },
        didDrawCell: function(data) {
            // Redraw text for colored headers in black
            if (data.section === 'head' && data.column.index >= 5 && data.column.index <= 9) {
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 3, {
                    align: 'center'
                });
            }
        }
    });
    
    const pdfBlob = doc.output('blob');
    generatedFiles.push({
        name: 'Wave_Plan_Yard_Marshall_Cycle1.pdf',
        blob: pdfBlob,
        type: 'Wave Plan PDF'
    });
}

function generateStagingPlanPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Extract unique dispatch times and sort them
    const uniqueDispatchTimes = [...new Set(data.map(row => row['Dispatch Time']))].sort();
    
    doc.setFontSize(20);
    doc.text('Staging Plan Cycle1', 14, 20);
    
    const tableData = data.map(row => {
        const wave = getWaveNumber(row['Dispatch Time'], uniqueDispatchTimes);
        const dsp = row['Driver'].replace('DSP:', '').trim();
        
        return [
            wave,
            row['Location'],
            row['Route Code'],
            dsp
        ];
    });
    
    // Sort by wave
    tableData.sort((a, b) => a[0] - b[0]);
    
    doc.autoTable({
        head: [['Wave', 'Location', 'Route Code', 'DSP']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 9, cellPadding: 2 }
    });
    
    const pdfBlob = doc.output('blob');
    generatedFiles.push({
        name: 'Staging_Plan_Cycle1.pdf',
        blob: pdfBlob,
        type: 'Staging Plan PDF'
    });
}

function generateDSPExcelFiles(dataByDSP) {
    // Extract unique dispatch times and sort them
    const allDispatchTimes = parsedData.map(row => row['Dispatch Time']);
    const uniqueDispatchTimes = [...new Set(allDispatchTimes)].sort();
    
    Object.keys(dataByDSP).forEach(dsp => {
        const routes = dataByDSP[dsp];
        
        const excelData = routes.map(row => {
            const wave = getWaveNumber(row['Dispatch Time'], uniqueDispatchTimes);
            const timing = calculateWaveTiming(row['Dispatch Time']);
            const location = row['Location'];
            const group = location.includes('-A') ? 'A' : 
                         location.includes('-B') ? 'B' : 
                         location.includes('-C') ? 'C' : 
                         location.includes('-D') ? 'D' : 
                         location.includes('-E') ? 'E' : 
                         location.includes('-F') ? 'F' : 
                         location.includes('-G') ? 'G' : '';
            
            return {
                'Wave': wave,
                'Arrival': timing.arrival,
                'Loading': timing.loading,
                'Leaving': timing.leaving,
                'Yard Empty': timing.yardEmpty,
                'Route Code': row['Route Code'],
                'DA ID': row['Type'],
                'Location': row['Location'],
                'Group': group
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Staging Plan');
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const today = new Date().toISOString().split('T')[0];
        generatedFiles.push({
            name: `Staging_Plan_${dsp}_${today}.xlsx`,
            blob: blob,
            type: `Excel file for ${dsp}`
        });
    });
}

function displayResults() {
    resultsList.innerHTML = '';
    
    // Add action buttons at the top
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
    
    // Add Email All button separately (full width)
    const emailAllBtn = document.createElement('button');
    emailAllBtn.className = 'email-all-btn';
    emailAllBtn.textContent = '📧 Create All Email Drafts';
    emailAllBtn.onclick = createAllEmailDrafts;
    resultsList.appendChild(emailAllBtn);
    
    // Get list of DSPs from generated Excel files
    const dspFiles = generatedFiles.filter(file => file.name.includes('Staging_Plan_') && file.name.endsWith('.xlsx'));
    const dsps = dspFiles.map(file => {
        const match = file.name.match(/Staging_Plan_(.+?)_/);
        return match ? match[1] : null;
    }).filter(dsp => dsp !== null);
    
    generatedFiles.forEach((file, index) => {
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
        
        // Add Email and Chime buttons only for DSP Excel files
        if (file.name.includes('Staging_Plan_') && file.name.endsWith('.xlsx')) {
            const match = file.name.match(/Staging_Plan_(.+?)_/);
            if (match) {
                const dsp = match[1];
                
                // Email button
                const emailBtn = document.createElement('button');
                emailBtn.className = 'email-btn';
                emailBtn.textContent = '📧 Email';
                emailBtn.onclick = () => {
                    createEmailDraft(dsp);
                };
                buttonContainer.appendChild(emailBtn);
                
                // Chime button
                const chimeBtn = document.createElement('button');
                chimeBtn.className = 'chime-btn';
                chimeBtn.textContent = '📢 Chime';
                chimeBtn.onclick = async () => {
                    chimeBtn.disabled = true;
                    chimeBtn.textContent = 'Sending...';
                    const success = await sendChimeNotification(dsp, true);
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
        }, index * 200); // Stagger downloads by 200ms
    });
}

async function sendChimeNotification(dsp, autoDownload = false) {
    const webhook = chimeWebhooks[dsp];
    if (!webhook) {
        alert(`No webhook configured for ${dsp}`);
        return false;
    }
    
    const today = new Date().toLocaleDateString('en-GB');
    let message = `Hi ${dsp}, the staging plan Cycle1 for ${today} was sent via email.`;
    
    // Find the Excel file for this DSP
    let fileToSend = null;
    let fileName = null;
    
    if (dsp === 'FULL_TABLE') {
        message = `The complete staging plans for Cycle1 for ${today} have been generated.`;
    } else {
        // Find the specific DSP Excel file
        fileToSend = generatedFiles.find(f => 
            f.name.includes(`Staging_Plan_${dsp}_`) && f.name.endsWith('.xlsx')
        );
        if (fileToSend) {
            fileName = fileToSend.name;
            message += `\n📊 File: ${fileName}`;
        }
    }
    
    try {
        const response = await fetch(webhook, {
            method: 'POST',
            mode: 'no-cors', // Must be before headers to bypass CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Content: message
            })
        });
        
        // With no-cors mode, we can't read the response, so we assume success
        console.log(`Chime message sent to ${dsp}`);
        
        // Auto-download the file when Chime is sent
        if (fileToSend && autoDownload) {
            setTimeout(() => {
                downloadFile(fileToSend.blob, fileName);
            }, 500);
        }
        return true;
        
    } catch (error) {
        console.error(`Error sending to ${dsp}:`, error);
        // Even with error, message likely sent due to no-cors
        // Still download the file
        if (fileToSend && autoDownload) {
            setTimeout(() => {
                downloadFile(fileToSend.blob, fileName);
            }, 500);
        }
        // Return true anyway since no-cors mode doesn't allow error checking
        return true;
    }
}

function createEmailDraft(dsp) {
    const today = new Date().toLocaleDateString('en-GB');
    const subject = `Staging Plan Cycle1 - ${today}`;
    const body = `Hi ${dsp},%0D%0A%0D%0APlease find attached the staging plan Cycle1 for ${today}.%0D%0A%0D%0ABest regards`;
    
    const recipientEmail = dspEmails[dsp] || '';
    const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
    
    // Open mailto link
    window.open(mailtoLink, '_blank');
    
    // Download the file so user can attach it manually
    const fileToSend = generatedFiles.find(f => 
        f.name.includes(`Staging_Plan_${dsp}_`) && f.name.endsWith('.xlsx')
    );
    
    if (fileToSend) {
        setTimeout(() => {
            downloadFile(fileToSend.blob, fileToSend.name);
        }, 500);
    }
}

function createAllEmailDrafts() {
    const dsps = ['ABFB', 'AMTP', 'BBGH', 'MDTR', 'NALG'];
    
    alert(`📧 Opening ${dsps.length} email drafts...\n📥 Files will be downloaded.\n\n⚠️ Please allow pop-ups in your browser!`);
    
    // Download all files first
    dsps.forEach((dsp, index) => {
        const fileToSend = generatedFiles.find(f => 
            f.name.includes(`Staging_Plan_${dsp}_`) && f.name.endsWith('.xlsx')
        );
        
        if (fileToSend) {
            setTimeout(() => {
                downloadFile(fileToSend.blob, fileToSend.name);
            }, index * 400);
        }
    });
    
    // Open email drafts with delay
    dsps.forEach((dsp, index) => {
        setTimeout(() => {
            createEmailDraft(dsp);
        }, (index * 800) + 2500); // Start after downloads
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

async function sendChimeToAll() {
    const dsps = ['ABFB', 'AMTP', 'BBGH', 'MDTR', 'NALG', 'FULL_TABLE'];
    
    const sendBtn = event.target;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    
    // First, download all DSP Excel files
    const dspExcelFiles = generatedFiles.filter(f => 
        f.name.includes('Staging_Plan_') && 
        f.name.endsWith('.xlsx') &&
        !f.name.includes('FULL_TABLE')
    );
    
    dspExcelFiles.forEach((file, index) => {
        setTimeout(() => {
            downloadFile(file.blob, file.name);
        }, index * 300);
    });
    
    // Wait a bit for downloads to start, then send Chimes
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    for (const dsp of dsps) {
        await sendChimeNotification(dsp, false); // false = don't auto-download again
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between sends
    }
    
    sendBtn.disabled = false;
    sendBtn.textContent = '📢 Send Chime to All';
    
    // With no-cors mode, we always assume success
    alert(`📢 Chime notifications sent to all ${dsps.length} recipients!\n📥 All DSP files downloaded.\n\n⚠️ Note: Please check Chime to confirm delivery (browser can't verify due to security).`);
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
