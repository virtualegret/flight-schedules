const { app, BrowserWindow, ipcMain, protocol, webContents } = require('electron');
const { autoUpdater } = require('electron-updater');
var fs = require('fs');
var path = require('path');
const isDev = require('electron-is-dev');


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
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('readAirportImport', (event, file) => {
  var data = fs.readFileSync(path.join(file[0]), 'utf8');
  data = data.split("\n")
  for(i in data){
    data[i] = data[i].split(",")
  }
  event.sender.send('readAirportImport', { data: data });
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