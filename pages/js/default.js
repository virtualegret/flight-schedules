const { ipcRenderer, dialog } = require('electron');
let $ = jQuery = require('jquery');
var axios = require('axios');
const { type } = require('jquery');


$(async function() {
    console.log("DOING ANYTHING HERE WILL PROBABLY BREAK THE APPLICATION!")
    window.localStorage.setItem("NOTICE", "EDITS MADE TO ANY OF THE FOLLOWING FIELDS WILL BREAK THE APPLICATION!");
    if(window.localStorage.getItem("airports") == null){
      window.localStorage.setItem("airports", JSON.stringify(['icao,iata,name,location,country,timezone,hub,lat,lon,ground_handling_cost,fuel_100ll_cost,fuel_jeta_cost,fuel_mogas_cost,notes'.split(",")]));
    }
    if(window.localStorage.getItem("flights") == null){
      window.localStorage.setItem("flights", JSON.stringify(['airline,flight_number,route_code,callsign,route_leg,dpt_airport,arr_airport,alt_airport,days,dpt_time,arr_time,level,distance,flight_time,flight_type,load_factor,load_factor_variance,pilot_pay,route,notes,start_date,end_date,active,subfleets,fares,fields'.split(",")]));
    }
    if(window.localStorage.getItem("pairs") == null){
      window.localStorage.setItem("pairs", JSON.stringify(['dep_icao,arr_icao,flights'.split(",")]));
    }

    let data = await ipcRenderer.sendSync('getSettings');
    
    runSetup();


    
    


})

async function runSetup(){
  let settings = JSON.parse(await ipcRenderer.sendSync('getSettings'));
  
  if(settings['fpdAPI'] == undefined){
    alert("Please read 'https://bit.ly/fdbapi' before continuing. It includes guide for the next question.")
    let res = await ipcRenderer.sendSync("dialogCreate", "Setup", "Flight Plan Database API Key", "Documentation: https://github.com/virtualegret/flight-schedules/wiki/Getting-FlightPlanDatabase-API-Key", 'input')
    
    if(res == 501 || res == 404)return runSetup();
    let result = await ipcRenderer.sendSync("RESTreq", "https://api.flightplandatabase.com/me", "get", { 
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + res
    })
    if(typeof result == "number"){
      alert("An error(" + result + ") occured while trying to get the flight route. Please try again.");
      return runSetup();
    }
    
    await ipcRenderer.sendSync('saveSettings', 'fpdAPI', res)
  }
}

async function clearSettings(){
  await ipcRenderer.sendSync("clearSetup")
  runSetup()
}

async function editSettings(){
  let settings = JSON.parse(await ipcRenderer.sendSync('getSettings'));
  
  if(settings['fpdAPI'] == undefined){
    return alert("Please run the setup first!")
  }else{
    
    let res = await ipcRenderer.sendSync("dialogCreate", "Setup", "Flight Plan Database API Key", settings['fpdAPI'], 'input')
    
    if(res == 404 || res == 501)return alert("Please enter a valid key.");
    let result = await ipcRenderer.sendSync("RESTreq", "https://api.flightplandatabase.com/me", "get", { 
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + res
    })
    if(typeof result == "number"){
      alert("An error(" + flightRoute + ") occured while trying to get the flight route. Please try again.");
      return
    }
    await ipcRenderer.sendSync('saveSettings', 'fpdAPI', res)
  }
}


function alert(message) {
    const options = {
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      title: 'Alert',
      message: message == undefined ? 'Oops! This is not supposed to be sent! Please report this bug!' : message
    };
  
    ipcRenderer.sendSync('dialog', 'showMessageBox', options)
  }
  
  function confirm(message) {
    const options = {
      type: 'info',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Alert',
      message: message == undefined ? 'Oops! This is not supposed to be sent! Please report this bug!' : message
    };
    let msg = ipcRenderer.sendSync('dialog', 'showMessageBox', options)
    return msg.response
  }

  
  async function menu() {
    // let confirmed = false;
  
    // if(document.getElementById("airportsInformation").rows.length > 1){
    //     let temp = await confirm("Are you sure you want to continue without saving?")
    //     confirmed = temp == 0 ? true : false;
    // }else{
    //     confirmed = true;
    // }
  
    // if(confirmed == false)return;
    window.location.href = '../index.html'
  }

  