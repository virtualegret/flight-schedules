// * Description: This is the main file of the application, it handles all of the main processes and the main window.

// * Packages Imports
const { app, dialog,BrowserWindow, ipcMain, webContents } = require('electron');
const { autoUpdater } = require('electron-updater');
const prompt = require('electron-prompt');
const isDev = require('electron-is-dev');
const axios = require('axios');
let log = require('electron-log');

// * Default JS Library Imports
var fs = require('fs');
var path = require('path');
const os = require('os');

// ? Checking the appropriate OS the app is ran on
const isMac = os.platform() === "darwin";
const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";


// * Prerun Setup
autoUpdater.allowPrerelease = false;
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// * Important House Keeping Informations
// 501 = cancelled signals
// 404 = not found
// 401 = unauthorized

// * This is the main window of the application.
let mainWindow;


// * This is the function that creates the main window of the application.
function createWindow () {
  // Logging important information
  log.info("Starting application...")
  log.info(`App version: ${app.getVersion()}`)

  // Setting notifications name to FSM if using windows
  if (isWindows) {
    app.setAppUserModelId("FSM");
  }

  // * Creating the main window
  // ! Changing webPreferences could break the application, be careful.
  mainWindow = new BrowserWindow({
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

  // * If under development envronment, load the index.html file, else load the updateCheck.html file.
  if(isDev){
    log.info("Development Environment Detected, skipping update check...")
    mainWindow.setSize(1000, 800);
    mainWindow.loadFile('index.html');
    mainWindow.center();
  }else{
    mainWindow.loadFile('updateCheck.html');
  }

  // * Handling the closing off the application and mainwindow.
  mainWindow.on('closed', function () {
    log.info("Application Closed.")
    mainWindow = null;
  });
}

// * Required pathing data
let downloadPath = app.getPath("downloads");

// * Runs when application is ready.
app.on('ready', () => {
  // Creates the main window
  createWindow();

  // Setting the application to not be resizable.
  log.info("Application Ready, Window no longer resizable.")
  mainWindow.setResizable(false);

  // * Checking for updates only if the application is a stable version.
  log.info("Starting Update Check...")
  if(isStableVersion(app.getVersion())){
    log.info("Production Environment Detected, checking for updates...")
    autoUpdater.checkForUpdatesAndNotify();
  }else{
    log.info("Non-Stable Version Detected, skipping update check...")
    mainWindow.loadFile('index.html');
    mainWindow.setSize(1000, 800);
    mainWindow.center();
  }
});

// * This function checks if the version is a stable version.
function isStableVersion(version){
  version = version.toLowerCase();

  if(version.includes("beta") || version.includes("dev")){
    return false
  }
  return true
}





// * When all windows closes, quit the application for macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// * When app is selected, check if main window exists, if not, create it.
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});





// * This function is called when the application cannot find new updates, therefore it will load the index.html file.
autoUpdater.on('update-not-available', () => {
  log.info("No Updates Available, launching application...")
  mainWindow.setSize(1000, 800);
  mainWindow.loadFile('index.html');
  mainWindow.center();
});

// * This function is called when the application finds new updates, and the update has been downloaded. It will then quit and install the update.
autoUpdater.on('update-downloaded', () => {
  log.info("Update Downloaded, installing application...")
  autoUpdater.quitAndInstall();
});





// * Receiving settings data from the settings file then returns it to the renderer process.
ipcMain.on('getSettings', (event) => {
  log.info("Getting Settings Data...");

  // If settings file exists.
  if(fs.existsSync(path.join(app.getPath("appData"), './FSM/settings.json'))){
    log.info("Settings File Exists, reading...")

    // Checking if the settings file is corrupted.
    let good;
    try{
      JSON.parse(fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8'))
      good = true
    }catch{
      log.error("Settings File Corrupted, clearing...")
      good = false
    }

    // If the settings file is corrupted, clear it and return a standard JSON. Else, return the settings file's content.
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

    // If the settings file does not exist, return a standard JSON.
    event.returnValue = JSON.stringify({});
  }
})

// * Clears the settings file, then returning the FS result of the deletion.
ipcMain.on("clearSetup", async (event) => {
  log.info("Clearing Settings Data...");
  event.returnValue = fs.unlinkSync(path.join(app.getPath("appData"), "./FSM/settings.json"))
})

// * Create a dialog with the given parameters.
// @params title: The title of the dialog.
// @params message: The message of the dialog.
ipcMain.on('saveSettings', (event, field, value) => {
  log.info("Saving Settings: " + field + " with value: " + value)

  // If the settings file does not exist, create it.
  if(!fs.existsSync(path.join(app.getPath("appData"), './FSM/settings.json'))){
    fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify({}, null, 2));
  }

  // Read the settings file, parse it, update the field with the value, then write it back to the file. Returns the result of the write.
  let data = fs.readFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), 'utf8').toString('utf8');
  data = JSON.parse(data);
  data[field] = value;
  event.returnValue = fs.writeFileSync(path.join(app.getPath("appData"), './FSM/settings.json'), JSON.stringify(data, null, 2));
})





// * Retrieving flight data from flightplandatabase.com. Returns the data to the renderer process.
// @params from: The ICAO code of the departure airport.
// @params to: The ICAO code of the arrival airport.
ipcMain.on("findFlightData", async (event, from, to) => {
  var config = {
    method: 'get',
    url: 'https://api.flightplandatabase.com/search/plans?toICAO=' + to + '&fromICAO=' + from,
  };
  
  // Error handler, provides a fail safe.
  let planSearch
  try{
    planSearch = await axios(config)
  }catch(e){
    planSearch = {
      data: e.response.status
    }
  }

  event.returnValue = planSearch;
  
})

// * Creating flight data from flightplandatabase.com. Returns the data to the renderer process.
// @params from: The ICAO code of the departure airport.
// @params to: The ICAO code of the arrival airport.
ipcMain.on("createFlightData", async (event, from, to) => {
  // Inside so the settings is updated every time the function is called.
  let settings = require(path.join(app.getPath("appData"), './FSM/settings.json'))


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

  // Error handler, provides a fail safe.
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

// * Retrieving flight route from flightplandatabase.com. Returns the data to the renderer process.
// @params id: The ID of the flightplandatabase.com flight plan.
ipcMain.on("findFlightRoute", async (event, id) => {
  var config = {
    method: 'get',
    url: 'https://api.flightplandatabase.com/plan/' + id,
  };

  // Error handler, provides a fail safe.
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





// * Create a prompt dialog with the given parameters.
// @params title: The title of the prompt dialog.
// @params label: The label of the prompt dialog.
// @params value: The value of the prompt dialog.
// @params type: The type of the prompt dialog.
ipcMain.on('dialogCreate', async (event, title, label, value, type) => {
  log.info("Prompt Requested: " + title + " with label: " + label + " and value: " + value + " and type: " + type)

  // Using the prompt addon and the parameters to create the dialog
  let data = await prompt({
      title: title,
      label: label,
      type: type,
      value: value,
      alwaysOnTop: true,
      icon: __dirname + '/buildResources/icon.png',
    })

    // Result handler, if the user cancels the dialog, return 501, if user did not fill prompt in, return 404, else return the data.
    let res;
    if(data == null){
      res = 501;
    }
    if(res != 501 && data == ""){
      res = 404;
    }
    if(res != 501 && res != 404)res = data;
    event.returnValue = res;
});

// * This function generates a dialog popup for the user.
// Returns: the user's input.
ipcMain.on('dialog', async (event, method, params) => {  
  log.info("Dialog Requested: " + method + " with params: " + JSON.stringify(params))    
  let data = await dialog[method](params);
  event.returnValue = data;
});

// * Create a REST Request.
// @params url: The URL of the REST Request.
// @params method: The method of the REST Request.
// @params header: The header of the REST Request.
ipcMain.on("RESTreq", async (event, url, method, header) => {
  log.info("REST Requested: " + url + " with method: " + method + " and header: " + header)

  var config = {
    method: method,
    url: url,
    headers: header
  };

  // Error handler, provides a fail safe.
  try{
    let result = await axios(config);
    event.returnValue = result.data
  }catch(e){
    event.returnValue = e.response.status;
  }
  
})





// * Get information for an airport from aviowiki.com.
// @params icao: The ICAO code of the airport.
ipcMain.on('getAirportInfo', async (event, icao) => {
  log.info("Getting Airport Info for: " + icao)
  var config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'http://api.aviowiki.com/free/airports/search?query=' + icao,
    headers: { }
  };
  
  // Error handler, provides a fail safe.
  let data
  try{
    data = await axios(config)
  }catch(e){
    data = {
      data: e.response.status
    }
  }

  log.info(icao + " response: " + JSON.stringify(data.data))

  // If the airport does not exist, return 404.
  if(data.data.content[0] == undefined || data.data.content[0].icao == null){
    event.returnValue = 404
    return
  }
  
  // If the airport exists, return the data.
  event.returnValue = data.data.content[0]
}); 


// * Create a dialog with the given parameters. Used for adding/editing airports.
// @params rowNum: The row number for the airport.
// @params name: The field for the edit.
// @params value: The value of the edit.
// @params require: If the field is required.
// @params defaults: The default value of the field.
ipcMain.on('editAirportDialog', async (event, rowNum, name, value, require, defaults) => {
  log.info("Editing Airport: " + name + " with value: " + value + " and require: " + require + " and defaults: " + defaults)
  let data = await prompt({
    title: 'Edit Airport',
    label: 'Enter the value for \'' + name + '\'',
    value: value,
    type: 'input',
    icon: __dirname + '/buildResources/icon.png',
  })

  // Result handler, if the user cancels the dialog, return 501, if user did not fill prompt in, return the default value(if field is required), else return the data.
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

// * Function to read the imported CSV Airport file.
// @params file: The file to read.
ipcMain.on('readAirportImport', (event, file) => {
  log.info("Reading Airport Import: " + file)
  var data = fs.readFileSync(path.join(file[0]), 'utf8');

  // Processing the data so renderer can read it.
  data = data.split("\n")
  
  for(i in data){
    data[i] = data[i].split(",")
  }
  log.info("CSV Data: " + data)
  event.sender.send('readAirportImport', { data: data });
});

// * Function to export the airport data to a CSV file.
// @params file: The file to export to.
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





// * Function to read the imported CSV Flights file.
// @params file: The file to read.
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

// * Function to export the flight data to a CSV file.
// @params file: The file to export to.
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

// * Creates a prompt used for editing/adding pairs.
// @params rowNum: The row number for the pair.
// @params name: The field for the edit.
// @params value: The value of the edit.
// @params require: If the field is required.
// @params defaults: The default value of the field.
ipcMain.on('editPairs', async (event, rowNum, name, value, require, defaults) => {
  log.info("Editing Pairs: " + name + " with value: " + value + " and require: " + require + " and defaults: " + defaults)
  let data = await prompt({
      title: 'Edit Pairs',
      label: 'Enter the value for \'' + name + '\'',
      value: value,
      type: 'input',
      icon: __dirname + '/buildResources/icon.png',
    })

    // Result handler, if the user cancels the dialog, return 501, if user did not fill prompt in, return the default value(if field is required), else return the data.
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
