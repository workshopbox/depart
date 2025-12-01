# DEPART File Processor

## 📁 File Structure

```
depart/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # All styling
├── js/
│   └── app.js         # All JavaScript logic
└── README.txt         # This file
```

## ✅ What Was Fixed:

### 1. DA ID Column
- Changed from `row['Route ID']` to `row['Type']`
- Excel files now show correct Amazon DA IDs starting with 'A'

### 2. Caproster Validation
- Paste Amazon Caproster data to validate times
- Compares Start Zeit with Dispatch Time by DA ID
- Shows differences before generating files

### 3. Smart Chime Notifications
- Button: "📢 Send Chime to Affected DSPs"
- Only sends to DSPs with time differences
- One message per DSP with all their issues
- Message includes Route Code, DA ID, Location, and both times

## 🚀 How to Use:

1. Open `index.html` in your browser
2. Upload DEPART CSV file
3. (Optional) Paste Caproster data for validation
4. If differences found, click "📢 Send Chime to Affected DSPs"
5. Click "🚀 Process File"
6. Download generated files

## 📊 Generated Files:

- Wave Plan PDF (for Yard Marshall)
- Staging Plan PDF (overview)
- Excel files for each DSP (NALG, AMTP, BBGH, MDTR, ABFB)
- Full Table Excel (all DSPs combined)

## ⚙️ Configuration:

Chime webhooks and email addresses are in `js/app.js` (lines 5-22).

To update:
1. Open `js/app.js`
2. Find `chimeWebhooks` and `dspEmails`
3. Update URLs/emails as needed

## ✅ Features:

✅ Correct DA IDs in Excel files
✅ Caproster time validation
✅ Smart Chime notifications to affected DSPs only
✅ Email drafts for all DSPs
✅ Batch operations
✅ Wave timing calculations
✅ Group detection (A-G)
✅ Professional UI

## 📝 Requirements:

- Modern web browser
- Internet connection (for CDN libraries)
- DEPART CSV export file
- (Optional) Caproster data for validation

## 🎯 Tested:

✅ DA IDs correct
✅ Caproster validation working
✅ Smart Chime notifications
✅ All features working
✅ Files separated properly
