const { app, dialog,BrowserWindow, ipcMain, webContents } = require('electron');
const { autoUpdater } = require('electron-updater');
const prompt = require('electron-prompt');
var fs = require('fs');
var path = require('path');
const isDev = require('electron-is-dev');
const axios = require('axios');
let log = require('electron-log');
const os = require('os');

const isMac = os.platform() === "darwin";
const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";

autoUpdater.allowPrerelease = false;


process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// 501 = cancelled signals
// 404 = not found
// 401 = unauthorized

// https://api.aviowiki.com/free/airports/search?query=KLAX

let mainWindow;

function createWindow () {
  log.info("Starting application...")
  log.info(`App version: ${app.getVersion()}`)
  if (isWindows) {
    app.setAppUserModelId("FSM");
  }
  mainWindow = new BrowserWindow({
    // width: 1000,
    // height: 800,
    width: 300,
    height: 500,
    autoHideMenuBar: true,
    icon: __dirname + '/buildResources/icon.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
  });

  if(isDev){
    log.info("Development Environment Detected, skipping update check...")
    mainWindow.setSize(1000, 800);
    mainWindow.loadFile('index.html');
    mainWindow.center();
  }else{
    mainWindow.loadFile('updateCheck.html');
  }
  mainWindow.on('closed', function () {
    log.info("Application Closed.")
    mainWindow = null;
  });
}

let downloadPath = app.getPath("downloads");

app.on('ready', () => {
  createWindow();
  log.info("Application Ready, Window no longer resizable.")
  mainWindow.setResizable(false);
  log.info("Starting Update Check...")
  if(isStableVersion(app.getVersion())){
    log.info("Production Environment Detected, checking for updates...")
    autoUpdater.checkForUpdatesAndNotify();
  }else{
    log.info("Stable Version Detected, skipping update check...")
    mainWindow.loadFile('index.html');
    mainWindow.setSize(1000, 800);
    mainWindow.center();
  }
});

function isStableVersion(version){
  version = version.toLowerCase();

  if(version.includes("beta") || version.includes("dev")){
    return false
  }
  return true
}


ipcMain.on('dialog', async (event, method, params) => {  
  log.info("Dialog Requested: " + method + " with params: " + JSON.stringify(params))    
  let data = await dialog[method](params);
  event.returnValue = data;
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

autoUpdater.on('update-not-available', () => {
  log.info("No Updates Available, launching application...")
  mainWindow.setSize(1000, 800);
  mainWindow.loadFile('index.html');
  mainWindow.center();
});

autoUpdater.on('update-downloaded', () => {
  log.info("Update Downloaded, installing application...")
  autoUpdater.quitAndInstall();
});

ipcMain.on('getSettings', (event) => {
  log.info("Getting Settings Data...");
  if(fs.existsSync(path.join(app.getPath("appData"), './FSM/settings.json'))){
    log.info("Settings File Exists, reading...")
    let good;
    try{
      JSON.parse(fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8'))
      good = true
    }catch{
      log.error("Settings File Corrupted, clearing...")
      good = false
    }
    if(good == false){
      log.info("Settings File Cleared, fixing...")
      fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify({}, null, 2))
      event.returnValue = JSON.stringify({});
    }else{
      log.info("Settings File Read, returning...")
      event.returnValue = fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8');
    }
  }else{
    log.info("Settings File Does Not Exist, returning just a standard JSON...")
    event.returnValue = JSON.stringify({});
  }
})

ipcMain.on("clearSetup", async (event) => {
  log.info("Clearing Settings Data...");
  event.returnValue = fs.unlinkSync(path.join(app.getPath("appData"), "./FSM/settings.json"))
})

ipcMain.on("findFlightData", async (event, from, to) => {
  var config = {
    method: 'get',
    url: 'https://api.flightplandatabase.com/search/plans?toICAO=' + to + '&fromICAO=' + from,
  };
  
  let planSearch = await axios(config)
  planSearch = planSearch.data;

  event.returnValue = planSearch;
  
})

ipcMain.on("createFlightData", async (event, from, to) => {
  let settings = require(path.join(app.getPath("appData"), './FSM/settings.json'))
  console.log(settings)
  var data = JSON.stringify({
    "fromICAO": from,
    "toICAO": to
  });
  
  var config = {
    method: 'post',
    url: 'https://api.flightplandatabase.com/auto/generate',
    headers: { 
      'Authorization': 'Basic ' + settings["fpdAPI"], 
      'Content-Type': 'application/json'
    },
    data : data
  };
  let planSearch
  try{
    planSearch = await axios(config)
  }catch(e){
    planSearch = {
      data: e.response.status
    }
  }
  planSearch = planSearch.data;

  event.returnValue = planSearch;
})

ipcMain.on("findFlightRoute", async (event, id) => {
  var config = {
    method: 'get',
    url: 'https://api.flightplandatabase.com/plan/' + id,
  };
  let route
  try{
    route = await axios(config)
  }catch(e){
    route = {
      data: e.response.status
    }
  }
  route = route.data;

  event.returnValue = route["route"]["nodes"];
  
})


ipcMain.on('dialogCreate', async (event, title, label, value, type) => {
  log.info("Prompt Requested: " + title + " with label: " + label + " and value: " + value + " and type: " + type)
  let data = await prompt({
      title: title,
      label: label,
      type: type,
      value: value,
      alwaysOnTop: true,
      icon: __dirname + '/buildResources/icon.png',
    })
    let res;
    if(data == null){
      res = 501;
    }
    if(data == ""){
      res = 404;
    }
    if(res != 501 && res != 404)res = data;
    event.returnValue = res;
});

ipcMain.on("RESTreq", async (event, url, method, header) => {
  log.info("REST Requested: " + url + " with method: " + method + " and header: " + header)

  var config = {
    method: method,
    url: url,
    headers: header
  };
  try{

    let result = await axios(config);
    event.returnValue = result.data
  }catch(e){
    event.returnValue = e.response.status;
  }
  
})

ipcMain.on('saveSettings', (event, field, value) => {
  log.info("Saving Settings: " + field + " with value: " + value)
  if(!fs.existsSync(path.join(app.getPath("appData"), './FSM/settings.json'))){
    fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify({}, null, 2));
  }
  let data = fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8');
  data = JSON.parse(data);

  data[field] = value;
  

  event.returnValue = fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify(data, null, 2));
})



ipcMain.on('getAirportInfo', async (event, icao) => {
  log.info("Getting Airport Info for: " + icao)
  var config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'http://api.aviowiki.com/free/airports/search?query=' + icao,
    headers: { }
  };
  
  let data
  try{
    data = await axios(config)
  }catch(e){
    data = {
      data: e.response.status
    }
  }
  log.info(icao + " response: " + data.data)
  let stop = false;
  if(data.data.content[0] == undefined || data.data.content[0].icao == null){
    event.returnValue = 404
    stop = true;
    
  }
  
  if(stop == false)event.returnValue = data.data.content[0]
}); 

ipcMain.on('editAirportDialog', async (event, rowNum, name, value, require, defaults) => {
  log.info("Editing Airport: " + name + " with value: " + value + " and require: " + require + " and defaults: " + defaults)
  let data = await prompt({
      title: 'Edit Airport',
      label: 'Enter the value for \'' + name + '\'',
      value: value,
      type: 'input',
      icon: __dirname + '/buildResources/icon.png',
    })

    let done = false;
    
    if(done == false && data == null){
      event.returnValue = { data: 501, rowNum: rowNum };
      done = true
    }
    if(done == false && require == true && data == ""){
      event.returnValue = { data: defaults, rowNum: rowNum };
      done = true
    }
    if(data == undefined)data = "";
  if(done == false){
    event.returnValue = { data: data, rowNum: rowNum };
  }
});

ipcMain.on('readAirportImport', (event, file) => {
  log.info("Reading Airport Import: " + file)
  var data = fs.readFileSync(path.join(file[0]), 'utf8');
  data = data.split("\n")
  
  for(i in data){
    data[i] = data[i].split(",")
  }
  log.info("CSV Data: " + data)
  event.sender.send('readAirportImport', { data: data });
});

ipcMain.on('readPairImport', (event, file) => {
  log.info("Reading Pairs Import: " + file)
  var data = fs.readFileSync(path.join(file[0]), 'utf8');
  data = data.split("\n")
  
  for(i in data){
    data[i] = data[i].split(",")
  }
  log.info("CSV Data: " + data)
  event.sender.send('readPairImport', { data: data });
});

ipcMain.on('exportAirport', (event, file) => {
  log.info("Exporting Airport Data: " + file)
  file = JSON.parse(file);
  for(i in file){
    file[i] = file[i].join(",")
  }
  file = file.join("\n")

  
  log.info("Converted CSV Data: " + file)

  fs.writeFile(path.join(downloadPath, "./exportedAirport.csv"), file, 'utf8', function (err) {
    if (err) {
      log.error(err)
      event.sender.send('exportAirport', { error: true });
    } else{
      event.sender.send('exportAirport', { error: false });
    }
  });
});

ipcMain.on('exportFlights', (event, file) => {
  file = JSON.parse(file);
  for(i in file){
    file[i] = file[i].join(",")
  }
  file = file.join("\n")
  log.info("Exporting CSV Data: " + file)

  fs.writeFile(path.join(downloadPath, "./exportedFlights.csv"), file, 'utf8', function (err) {
    if (err) {
      log.error(err)
      event.sender.send('exportFlights', { error: true });
    } else{
      event.sender.send('exportFlights', { error: false });
    }
  });
});


ipcMain.on('editPairs', async (event, rowNum, name, value, require, defaults) => {
  log.info("Editing Pairs: " + name + " with value: " + value + " and require: " + require + " and defaults: " + defaults)
  let data = await prompt({
      title: 'Edit Pairs',
      label: 'Enter the value for \'' + name + '\'',
      value: value,
      type: 'input',
      icon: __dirname + '/buildResources/icon.png',
    })

    let done = false;
    
    if(done == false && data == null){
      event.returnValue = { data: 501, rowNum: rowNum };
      done = true
    }
    if(done == false && require == true && data == ""){
      event.returnValue = { data: defaults, rowNum: rowNum };
      done = true
    }
    if(data == undefined)data = "";
  if(done == false){
    event.returnValue = { data: data, rowNum: rowNum };
  }
});