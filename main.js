const { app, dialog,BrowserWindow, ipcMain, protocol, webContents } = require('electron');
const { autoUpdater } = require('electron-updater');
const airportInfo = require("airport-info")
const prompt = require('electron-prompt');
var fs = require('fs');
var path = require('path');
const isDev = require('electron-is-dev');
const axios = require('axios');

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