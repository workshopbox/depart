// Caproster Validation - NEW FEATURE

function parseCaprosterData(caprosterText) {
    const lines = caprosterText.trim().split('\n');
    const caprosterMap = {};
    if (lines.length === 0) return caprosterMap;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        let parts = line.split('\t');
        
        if (parts.length >= 6) {
            const daID = parts[0].trim().replace(/"/g, '');
            const startTime = parts[5].trim().replace(/"/g, '');
            
            if (daID.startsWith('A') && startTime) {
                let convertedTime = startTime.toLowerCase().replace(/\s+/g, '');
                const timeMatch = convertedTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
                
                if (timeMatch) {
                    let hour = parseInt(timeMatch[1]);
                    const minute = timeMatch[2];
                    const period = timeMatch[3];
                    
                    if (period === 'pm' && hour !== 12) hour += 12;
                    else if (period === 'am' && hour === 12) hour = 0;
                    
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
    
    if (!parsedData || parsedData.length === 0) return { isValid: true, differences: [] };
    
    const caprosterMap = parseCaprosterData(caprosterText);
    
    if (Object.keys(caprosterMap).length === 0) {
        validationResults.innerHTML = `<div class="validation-header warning">⚠️ Could not parse Caproster data</div><div class="validation-summary"><p>Please check the format. Expected tab-separated with DA ID in first column and start time.</p></div>`;
        validationResults.classList.add('show');
        return { isValid: false, differences: [] };
    }
    
    const differences = [];
    
    parsedData.forEach(row => {
        const routeCode = row['Route Code'];
        const daID = row['Type'];
        const departDispatchTime = row['Dispatch Time'];
        const caprosterStartZeit = caprosterMap[daID];
        
        if (caprosterStartZeit && departDispatchTime.trim() !== caprosterStartZeit.trim()) {
            const dsp = row['Driver'].replace('DSP:', '').trim();
            differences.push({ routeCode, daID, departTime: departDispatchTime.trim(), caprosterTime: caprosterStartZeit.trim(), location: row['Location'], dsp });
        }
    });
    
    if (differences.length === 0) {
        validationResults.innerHTML = `<div class="validation-header success">✅ Validation Successful</div><div class="validation-summary"><p><strong>All times match!</strong></p><p>Compared ${Object.keys(caprosterMap).length} DA IDs from Caproster. No discrepancies found.</p></div>`;
        validationResults.classList.add('show');
        return { isValid: true, differences: [] };
    } else {
        let differencesHTML = differences.map(diff => `<div class="difference-item"><strong>${diff.routeCode}</strong> (DA ID: ${diff.daID}) - ${diff.location} (${diff.dsp})<div class="difference-details"><div>📦 DEPART Dispatch Time: <strong>${diff.departTime}</strong></div><div>🕒 Caproster Start Zeit: <strong>${diff.caprosterTime}</strong></div></div></div>`).join('');
        
        validationResults.innerHTML = `<div class="validation-header warning">⚠️ Time Differences Found</div><div class="validation-summary"><p><strong>${differences.length} route(s) have different times:</strong></p></div>${differencesHTML}<div class="validation-summary" style="margin-top: 15px;"><p><strong>⚠️ Please review these differences before generating files!</strong></p><button onclick="notifyDSPsAboutDifferences()" class="chime-btn" style="width: 100%; margin-top: 15px; padding: 15px;">📢 Send Chime to Affected DSPs</button></div>`;
        validationResults.classList.add('show');
        window.timeDifferences = differences;
        return { isValid: false, differences };
    }
}

async function notifyDSPsAboutDifferences() {
    if (!window.timeDifferences || window.timeDifferences.length === 0) {
        alert('No time differences to notify about.');
        return;
    }
    
    const dspDifferences = {};
    window.timeDifferences.forEach(diff => {
        if (!dspDifferences[diff.dsp]) dspDifferences[diff.dsp] = [];
        dspDifferences[diff.dsp].push(diff);
    });
    
    const affectedDSPs = Object.keys(dspDifferences);
    if (!confirm(`Send Chime notifications to ${affectedDSPs.length} DSP(s): ${affectedDSPs.join(', ')}?`)) return;
    
    for (const dsp of affectedDSPs) {
        const webhook = chimeWebhooks[dsp];
        if (!webhook) { console.log(`No webhook for ${dsp}`); continue; }
        
        const diffs = dspDifferences[dsp];
        const today = new Date().toLocaleDateString('en-GB');
        
        let message = `⚠️ DEPART Time Differences Alert - ${today}\n\nHi ${dsp},\n\nThe following route(s) have different start times between DEPART and Caproster:\n\n`;
        diffs.forEach(diff => { message += `• ${diff.routeCode} (${diff.location})\n  DA ID: ${diff.daID}\n  DEPART: ${diff.departTime}\n  Caproster: ${diff.caprosterTime}\n\n`; });
        message += `Please verify which time is correct before dispatching.\n`;
        
        try {
            await fetch(webhook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Content: message }) });
            console.log(`✅ Chime sent to ${dsp}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) { console.error(`Error sending to ${dsp}:`, error); }
    }
    
    alert(`📢 Chime notifications sent to ${affectedDSPs.length} DSP(s):\n${affectedDSPs.join('\n')}\n\n⚠️ Note: Please check Chime to confirm delivery.`);
}

document.addEventListener('DOMContentLoaded', () => {
    const caprosterInput = document.getElementById('caprosterInput');
    if (caprosterInput) {
        let validationTimeout;
        caprosterInput.addEventListener('input', () => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => {
                if (caprosterInput.value.trim() && parsedData) validateCaproster();
            }, 1000);
        });
    }
});
