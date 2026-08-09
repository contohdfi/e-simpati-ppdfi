function doPost(e) {
  let response = { status: 'success', data: null };
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const args = postData.args || [];
    
    // Routing action ke fungsi yang sesuai
    if (action === 'getInitialData') {
      response.data = getInitialData();
    } else if (action === 'saveAttendanceBatch') {
      response.data = saveAttendanceBatch.apply(null, args);
    } else if (action === 'getRekapData') {
      response.data = getRekapData();
    } else if (action === 'shiftPeriod') {
      response.data = shiftPeriod.apply(null, args);
    } else {
      throw new Error("Action not found.");
    }
  } catch (error) {
    response.status = 'error';
    response.message = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function getInitialData() {
  try {
    const db = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = db.getSheetByName("DATA");
    
    // Ambil Data Kegiatan & Pengajar
    const dataValues = dataSheet.getDataRange().getDisplayValues();
    let activities = {};
    let teachers = new Set();
    
    for(let i = 1; i < dataValues.length; i++) {
      let kegiatan = dataValues[i][0];
      let pengajar = dataValues[i][1];
      
      if(!kegiatan || String(kegiatan).includes("#") || !pengajar || String(pengajar).includes("#")) continue; 
      
      if(!activities[kegiatan]) activities[kegiatan] = [];
      activities[kegiatan].push(pengajar);
      teachers.add(pengajar);
    }
    
    const attSheet = db.getSheetByName("DAFTAR KEHADIRAN");
    const attValues = attSheet.getDataRange().getDisplayValues(); 
    
    let totalHadir = 0, totalTidakHadir = 0, totalBadal = 0;
    let history = [];
    
    for(let i = 1; i < attValues.length; i++) {
      let status = attValues[i][4];
      let jam = Number(attValues[i][5]) || 0;
      let badal = attValues[i][7];
      
      if (status === 'Hadir') totalHadir += jam;
      if (status === 'Tidak Hadir') totalTidakHadir += jam;
      if (badal && badal.trim() !== '') totalBadal += jam; 
    }
    
    for(let i = attValues.length - 1; i >= 1 && history.length < 50; i--) {
      history.push({
        tanggal: attValues[i][1],
        kegiatan: attValues[i][2],
        pengajar: attValues[i][3],
        status: attValues[i][4],
        jam: attValues[i][5],
        badal: attValues[i][7]
      });
    }

    const jadwalSheet = db.getSheetByName("JADWAL");
    let schedule = {};
    if (jadwalSheet) {
      const jadwalValues = jadwalSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < jadwalValues.length; i++) {
        let hari = jadwalValues[i][0].trim();
        let kegiatan = jadwalValues[i][1].trim();
        if (!hari || !kegiatan) continue;
        
        if (!schedule[hari]) schedule[hari] = [];
        if (!schedule[hari].includes(kegiatan)) {
          schedule[hari].push(kegiatan);
        }
      }
    }

    return {
      activities: activities,
      teachers: Array.from(teachers).sort(),
      schedule: schedule, 
      activePeriod: getActivePeriod(),
      stats: { hadir: totalHadir, tidakHadir: totalTidakHadir, badal: totalBadal },
      history: history 
    };

  } catch (e) {
    throw new Error(e.message);
  }
}

function getActivePeriod() {
  const props = PropertiesService.getScriptProperties();
  let period = props.getProperty("ACTIVE_PERIOD");
  if(!period) { period = "Juli 2026"; props.setProperty("ACTIVE_PERIOD", period); }
  return period;
}

function getRekapData() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const rekapSheet = db.getSheetByName("REKAP");
  const attendanceSheet = db.getSheetByName("DAFTAR KEHADIRAN");
  
  const data = rekapSheet.getDataRange().getDisplayValues();
  const attData = attendanceSheet.getDataRange().getValues(); 
  
  let activities = {};
  let badalDetails = {}; 
  
  for (let i = 1; i < attData.length; i++) {
    let kegiatan = attData[i][2];
    let pengajar = attData[i][3];
    let jam = Number(attData[i][5]) || 0; 
    let badal = attData[i][7];    
    
    if(badal) {
      if(!badalDetails[kegiatan]) badalDetails[kegiatan] = {};
      let key = `${badal} -> Membadali ${pengajar}`;
      badalDetails[kegiatan][key] = (badalDetails[kegiatan][key] || 0) + jam;
    }
  }

  if(data.length > 1) {
    for(let i = 1; i < data.length; i++) {
      let kegiatan = data[i][0];
      let pengajar = data[i][1];
      
      if(!kegiatan || String(kegiatan).includes("#")) continue;
      
      if(!activities[kegiatan]) activities[kegiatan] = [];
      activities[kegiatan].push({
        pengajar: pengajar,
        hadir: data[i][2], 
        tidakHadir: data[i][3], 
        membadali: data[i][4],
        persen: data[i][5]
      });
    }
  }
  
  return { activities: activities, badalDetails: badalDetails };
}

function saveAttendanceBatch(dataArray, customDateStr) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
    
    const db = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = db.getSheetByName("DAFTAR KEHADIRAN"); 
    const period = getActivePeriod();
    
    let today = customDateStr;
    if (!today) {
      today = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
    }
    
    let rowsToInsert = [];
    const existingData = sheet.getDataRange().getValues();
    
    for (let data of dataArray) {
      let isDuplicate = existingData.some(row => 
        String(row[1]).substring(0, 10) == today.substring(0, 10) && row[2] == data.kegiatan && row[3] == data.pengajar
      );
      
      if (isDuplicate) throw new Error(`Data ${data.pengajar} untuk ${data.kegiatan} pada tanggal tersebut sudah ada!`);
      
      rowsToInsert.push([
        "'" + period, 
        today, 
        data.kegiatan, 
        data.pengajar, 
        data.status, 
        data.jam || 0, 
        data.keterangan || "", 
        data.badal || "", 
        "Admin" 
      ]);
    }
    
    if (rowsToInsert.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, rowsToInsert[0].length).setValues(rowsToInsert);
    }
    
    return { status: "success", message: "Data berhasil disimpan." };
    
  } catch (e) {
    return { status: "error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function shiftPeriod(newPeriod) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = SpreadsheetApp.getActiveSpreadsheet();
    const attendanceSheet = db.getSheetByName("DAFTAR KEHADIRAN");
    const recoverySheet = db.getSheetByName("RECOVERY");
    
    const data = attendanceSheet.getDataRange().getValues();
    
    if(data.length > 1) {
      const dataToMove = data.slice(1);
      recoverySheet.getRange(recoverySheet.getLastRow() + 1, 1, dataToMove.length, dataToMove[0].length).setValues(dataToMove);
      
      attendanceSheet.getRange(2, 1, attendanceSheet.getLastRow(), attendanceSheet.getLastColumn()).clearContent();
    }
    
    PropertiesService.getScriptProperties().setProperty("ACTIVE_PERIOD", newPeriod);
    
    return { status: "success", message: `Periode berhasil diganti ke ${newPeriod}` };
  } catch (e) {
    return { status: "error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}
