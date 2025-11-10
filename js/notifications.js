// Notification functions for Chime and Email

async function sendChimeNotification(dsp, autoDownload = false) {
    const webhook = chimeWebhooks[dsp];
    if (!webhook) {
        alert(`No webhook configured for ${dsp}`);
        return false;
    }
    
    const today = new Date().toLocaleDateString('en-GB');
    let message = `Hi ${dsp}, the staging plan Cycle1 for ${today} was sent via email.`;
    
    let fileToSend = null;
    let fileName = null;
    
    if (dsp === 'FULL_TABLE') {
        message = `The complete staging plans for Cycle1 for ${today} have been generated.`;
    } else {
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
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Content: message
            })
        });
        
        console.log(`Chime message sent to ${dsp}`);
        
        if (fileToSend && autoDownload) {
            setTimeout(() => {
                downloadFile(fileToSend.blob, fileName);
            }, 500);
        }
        return true;
        
    } catch (error) {
        console.error(`Error sending to ${dsp}:`, error);
        if (fileToSend && autoDownload) {
            setTimeout(() => {
                downloadFile(fileToSend.blob, fileName);
            }, 500);
        }
        return true;
    }
}

function createEmailDraft(dsp) {
    const today = new Date().toLocaleDateString('en-GB');
    const subject = `Staging Plan Cycle1 - ${today}`;
    const body = `Hi ${dsp},%0D%0A%0D%0APlease find attached the staging plan Cycle1 for ${today}.%0D%0A%0D%0ABest regards`;
    
    const recipientEmail = dspEmails[dsp] || '';
    const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
    
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
    
    dsps.forEach((dsp, index) => {
        setTimeout(() => {
            createEmailDraft(dsp);
        }, (index * 800) + 2500);
    });
}

async function sendChimeToAll() {
    const dsps = ['ABFB', 'AMTP', 'BBGH', 'MDTR', 'NALG', 'FULL_TABLE'];
    
    const sendBtn = event.target;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    
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
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    for (const dsp of dsps) {
        await sendChimeNotification(dsp, false);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    sendBtn.disabled = false;
    sendBtn.textContent = '📢 Send Chime to All';
    
    alert(`📢 Chime notifications sent to all ${dsps.length} recipients!\n📥 All DSP files downloaded.\n\n⚠️ Note: Please check Chime to confirm delivery (browser can't verify due to security).`);
}
