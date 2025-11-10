# DEPART File Processor

A web application for processing DEPART CSV files and generating Wave Plans and Staging Plans.

## 📁 Project Structure

```
depart_app/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # All styling
└── js/
    ├── config.js          # Webhooks and email configuration
    ├── utils.js           # Utility functions (timing, downloads, etc.)
    ├── generators.js      # PDF and Excel generation functions
    ├── notifications.js   # Chime and Email notification functions
    └── app.js            # Main application logic and UI
```

## 🚀 How to Use

1. Open `index.html` in a web browser
2. Upload your DEPART CSV file (drag & drop or click to browse)
3. Click "Process File"
4. Download the generated files or send notifications

## 📦 Generated Files

The app creates:
1. **Wave Plan PDF** - Yard Marshall schedule with color-coded DSPs
2. **Staging Plan PDF** - Complete route listing
3. **Excel files** - Individual staging plans for each DSP (ABFB, AMTP, BBGH, MDTR, NALG)

## ⚙️ Configuration

### Chime Webhooks
Edit `js/config.js` to update Chime webhook URLs for each DSP.

### Email Addresses
Edit `js/config.js` to update email addresses for each DSP:
- ABFB: dap8-dispatcher@albatros-express.at
- AMTP: dap8-dispatcher@allmuna.at
- BBGH: dap8-dispatcher@baba-trans.at
- MDTR: mdtransportlanzmaier@gmail.com
- NALG: dap8-dispatcher@niazipaketlogistik.at

## 🎨 Features

- **Drag & Drop Upload** - Easy file upload
- **Progress Tracking** - Visual progress bar
- **Batch Actions**:
  - Download All Files
  - Send Chime to All
  - Create All Email Drafts
- **Individual Actions** per file:
  - Download
  - Email Draft
  - Chime Notification

## 📋 File Descriptions

### index.html
Main HTML structure with file upload area, progress display, and results section.

### css/style.css
Complete styling including:
- Purple gradient theme
- Responsive buttons
- Upload area with drag & drop
- Result cards with hover effects

### js/config.js
Configuration for:
- Chime webhook URLs for all DSPs
- Email addresses for all DSPs

### js/utils.js
Utility functions:
- `getWaveNumber()` - Calculate wave number from dispatch time
- `calculateWaveTiming()` - Calculate arrival, loading, leaving, yard empty times
- `downloadFile()` - Download blob as file
- `downloadAllFiles()` - Download all generated files
- `updateProgress()` - Update progress bar
- `showError()` - Display error messages

### js/generators.js
File generation functions:
- `generateWavePlanPDF()` - Create Wave Plan with color-coded DSP columns
- `generateStagingPlanPDF()` - Create complete staging plan
- `generateDSPExcelFiles()` - Create individual Excel files for each DSP

### js/notifications.js
Notification functions:
- `sendChimeNotification()` - Send Chime message to DSP
- `sendChimeToAll()` - Send Chime to all DSPs
- `createEmailDraft()` - Open email draft for DSP
- `createAllEmailDrafts()` - Open email drafts for all DSPs

### js/app.js
Main application logic:
- File upload handling
- CSV parsing
- Data processing
- UI updates
- Results display

## 🔧 Dependencies

All dependencies are loaded via CDN:
- **PapaParse** - CSV parsing
- **jsPDF** - PDF generation
- **jsPDF-AutoTable** - PDF table formatting
- **SheetJS (XLSX)** - Excel file generation

## 📝 Notes

- **Chime Notifications**: Due to browser CORS restrictions, delivery cannot be verified. Always check Chime to confirm.
- **Email Drafts**: Requires allowing pop-ups in your browser.
- **Wave Timing Logic**: Dispatch Time in CSV = Loading Time. Arrival is 20 min before.

## 🎯 Wave Plan Colors

- **NALG** - Yellow
- **AMTP** - Magenta
- **BBGH** - Blue
- **MDTR** - Orange
- **ABFB** - Green
