// File generation functions for PDFs and Excel files

function generateWavePlanPDF(dataByWave, waveTimings) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
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
            0: { cellWidth: 15 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
            7: { cellWidth: 20 },
            8: { cellWidth: 20 },
            9: { cellWidth: 20 },
            10: { cellWidth: 15 },
            11: { cellWidth: 20 }
        },
        willDrawCell: function(data) {
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
                doc.setFillColor(100, 100, 100);
            }
        },
        didDrawCell: function(data) {
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
