const { ipcRenderer } = require('electron');
const {dialog} = require('electron').remote;

window.onload = function() {
  if(window.localStorage.getItem("airports") == null){
    window.localStorage.setItem("airports", JSON.stringify(['icao,iata,name,location,country,timezone,hub,lat,lon,ground_handling_cost,fuel_100ll_cost,fuel_jeta_cost,fuel_mogas_cost,notes'.split(",")]));
  }
  if(window.localStorage.getItem("flights") == null){
    window.localStorage.setItem("flights", JSON.stringify(['airline,flight_number,route_code,callsign,route_leg,dpt_airport,arr_airport,alt_airport,days,dpt_time,arr_time,level,distance,flight_time,flight_type,load_factor,load_factor_variance,pilot_pay,route,notes,start_date,end_date,active,subfleets,fares,fields'.split(",")]));
  }
  if(window.localStorage.getItem("pairs") == null){
    window.localStorage.setItem("pairs", JSON.stringify(['dep_icao,arr_icao'.split(",")]));
  }

  let data = JSON.parse(window.localStorage.getItem("airports"));
  if(data.length <= 1){
    alert("Please add an airport first!");
    window.location.href = "airports.html";
  }

  load(JSON.parse(window.localStorage.getItem("pairs")));
}


function alert(message) {
    const options = {
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      title: 'Alert',
      message: message == undefined ? 'Oops! This is not supposed to be sent! Please report this bug!' : message
    };
  
    dialog.showMessageBox(null, options, (response, checkboxChecked) => {
    });
  }
  
  function confirm(message) {
    const options = {
      type: 'info',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Alert',
      message: message == undefined ? 'Oops! This is not supposed to be sent! Please report this bug!' : message
    };
    let msg = dialog.showMessageBox(null, options)
    return msg
  }
  

  function createPair(){
    let dep = ipcRenderer.sendSync('editPairs', 0, "DepartureICAO(rqd)", "", true, "");
    dep = dep.data;
    if(dep == 501)return;
    if(dep == "")return alert("Departure Airport cannot be empty!");
    let arr = ipcRenderer.sendSync('editPairs', 0, "ArrivalICAO(rqd)", "", true, "");
    arr = arr.data;
    if(arr == 501)return;
    if(arr == "")return alert("Departure Airport cannot be empty!");
    if(airportExist(dep) == false)return alert("Departure Airport not found!");	
    if(airportExist(arr) == false)return alert("Arrival Airport not found!");
    if(pairExist(dep, arr) == true)return alert("Pair Already Exists!");

    let data = JSON.parse(window.localStorage.getItem("pairs"));
    data.push([dep.toUpperCase(), arr.toUpperCase()]);
    window.localStorage.setItem("pairs", JSON.stringify(data));
    load(data);
  }

  function pairExist(dep, arr){
    let data = JSON.parse(window.localStorage.getItem("pairs"));
    let res = false
    for(i in data){
        if(data[i][0].toString().toLowerCase() == dep.toString().toLowerCase() && data[i][1].toString().toLowerCase() == arr.toString().toLowerCase()){
            res = true;
            break;
        }
    }
    return res;
  }

  function airportExist(icao){
    let data = JSON.parse(window.localStorage.getItem("airports"));
    let res = false
    for(i in data){
        if(data[i][0].toString().toLowerCase() == icao.toString().toLowerCase()){
            res = true;
            break;
        }
    }
    return res;
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


  function load(data) {
    document.getElementById("pairsInformation").innerHTML = `
  <tr>
    <th>Depature ICAO</th>
    <th>Arrival ICAO</th>
    <th>Actions</th>
  </tr>
      `
  
    for(i in data){
          if(i != 0 && data[i].length > 1){
              document.getElementById("pairsInformation").innerHTML += `
  <tr>
    <td>${data[i][0]}</td>
    <td>${data[i][1]}</td>
    <td><button onClick="edit(${i})">Edit</button></td>
  </tr>
              `
          }
      }
  }
  