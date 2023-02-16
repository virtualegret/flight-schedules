const { app, dialog,BrowserWindow, ipcMain, protocol, webContents } = require('electron');
const { autoUpdater } = require('electron-updater');
const airportInfo = require("airport-info")
const prompt = require('electron-prompt');
var fs = require('fs');
var path = require('path');
const isDev = require('electron-is-dev');
const axios = require('axios');
const os = require('os');
const storage = require('electron-json-storage');

storage.setDataPath(os.tmpdir());

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// 501 = cancelled signal
// 404 = not found

// https://api.aviowiki.com/free/airports/search?query=KLAX

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true
  }
}]);

let mainWindow;

function createWindow () {
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
    mainWindow.setSize(1000, 800);
    mainWindow.loadFile('index.html');
    mainWindow.center();
  }else{
    mainWindow.loadFile('updateCheck.html');
  }
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

let downloadPath = app.getPath("downloads");

app.on('ready', () => {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6);
    callback({
        path: path.normalize(`${__dirname}/${url}`)
    });
}, (error) => {
    if (error) console.error('Failed to register protocol');
});
  createWindow();
  mainWindow.setResizable(false);
  autoUpdater.checkForUpdatesAndNotify();

  
  
});


ipcMain.on('dialog', async (event, method, params) => {       
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

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});


autoUpdater.on('update-not-available', () => {
  mainWindow.setSize(1000, 800);
  mainWindow.loadFile('index.html');
  mainWindow.center();
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('getSettings', (event) => {
  if(fs.existsSync(path.join(app.getPath("appData"), './FSM/settings.json'))){
    let good;
    try{
      JSON.parse(fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8'))
      good = true
    }catch{
      good = false
    }
    if(good == false){
      fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify({}, null, 2))
      event.returnValue = JSON.stringify({});
    }else{
      event.returnValue = fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8');
    }
  }else{
    event.returnValue = JSON.stringify({});
  }
})

ipcMain.on("clearSetup", async (event) => {
  event.returnValue = fs.unlinkSync(path.join(app.getPath("appData"), "./FSM/settings.json"))
})


ipcMain.on('dialogCreate', async (event, title, label, value, type) => {
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
  if(!fs.existsSync(path.join(app.getPath("appData"), './FSM/settings.json'))){
    fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify({}, null, 2));
  }
  let data = fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8');
  data = JSON.parse(data);

  data[field] = value;
  

  event.returnValue = fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify(data, null, 2));
})



ipcMain.on('getAirportInfo', async (event, icao) => {
  var config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'http://api.aviowiki.com/free/airports/search?query=' + icao,
    headers: { }
  };
  
  let data = await axios(config)
  let stop = false;
  if(data.data.content[0] == undefined || data.data.content[0].icao == null){
    event.returnValue = 404
    stop = true;
    
  }
  
  if(stop == false)event.returnValue = data.data.content[0]
}); 

ipcMain.on('editAirportDialog', async (event, rowNum, name, value, require, defaults) => {
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
  var data = fs.readFileSync(path.join(file[0]), 'utf8');
  data = data.split("\n")
  
  for(i in data){
    data[i] = data[i].split(",")
  }
  event.sender.send('readAirportImport', { data: data });
});

ipcMain.on('readPairImport', (event, file) => {
  var data = fs.readFileSync(path.join(file[0]), 'utf8');
  data = data.split("\n")
  
  for(i in data){
    data[i] = data[i].split(",")
  }
  event.sender.send('readPairImport', { data: data });
});

ipcMain.on('exportAirport', (event, file) => {
  file = JSON.parse(file);
  for(i in file){
    file[i] = file[i].join(",")
  }
  file = file.join("\n")

  fs.writeFile(path.join(downloadPath, "./exportedAirport.csv"), file, 'utf8', function (err) {
    if (err) {
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

  fs.writeFile(path.join(downloadPath, "./exportedFlights.csv"), file, 'utf8', function (err) {
    if (err) {
      event.sender.send('exportFlights', { error: true });
    } else{
      event.sender.send('exportFlights', { error: false });
    }
  });
});


ipcMain.on('editPairs', async (event, rowNum, name, value, require, defaults) => {
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