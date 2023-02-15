const { ipcRenderer } = require('electron');
const {dialog} = require('electron').remote;

window.onload = function() {
  let data = JSON.parse(window.localStorage.getItem("airports"));
  if(data.length <= 1){
    alert("Please add an airport first!");
    window.location.href = "airports.html";
  }
  load(JSON.parse(window.localStorage.getItem("pairs")));
}

ipcRenderer.on("exportFlights", (event, data) => {
  if(data.error == true){
    alert("An error occured!")
  }else{
    alert("Exported!")
  }
})

ipcRenderer.on("readPairImport", (event, data) => {
  data = data.data;
  window.localStorage.setItem("flights", JSON.stringify(data));
  data.shift();
  let temps = ['dep_icao,arr_icao,flights'.split(",")];
  for(i in data){
      if(data[i][5] == undefined || data[i][6] == undefined)continue;
      if(checkExist(temps, data[i][5], data[i][6]) == false){
        temps.push([data[i][5], data[i][6], []])
      }
  }

  for(i in data){
      if(data[i][5] == undefined || data[i][6] == undefined)continue;
      for(j in temps){
          if(temps[j][0] == data[i][5] && temps[j][1] == data[i][6]){
              temps[j][2].push(data[i][0] + data[i][1])
          }
      }
  }

  

  window.localStorage.setItem("pairs", JSON.stringify(temps));
  load(JSON.parse(window.localStorage.getItem("pairs")));
})

  async function importPair(){

    let confirmed = false;
    
    if(document.getElementById("pairsInformation").rows.length > 1){
        let temp = await confirm("Are you sure you want to continue without saving?")
        confirmed = temp == 0 ? true : false;
    }else{
        confirmed = true;
    }

    if(confirmed == false)return
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'phpVMS Flights Export CSV', extensions: ['csv'] }
        ]
    }, function (files) {
        if (files !== undefined) {
            // handle files
            ipcRenderer.send('readPairImport', files)
        }
    });
  }

  function exportFlights(){
    var oRows = document.getElementById('pairsInformation').getElementsByTagName('tr');
    var iRowCount = oRows.length;
    if(iRowCount == 1){
        alert("There is nothing to export!")
        return;
    }
    let information = window.localStorage.getItem("flights");
    ipcRenderer.send('exportFlights', information)
  }

  function clearPairs(){
    let warn = confirm("Are you sure you want to clear all pairs? This cannot be undone!");
    if(warn == 1)return;
    window.localStorage.setItem("flights", JSON.stringify(['airline,flight_number,route_code,callsign,route_leg,dpt_airport,arr_airport,alt_airport,days,dpt_time,arr_time,level,distance,flight_time,flight_type,load_factor,load_factor_variance,pilot_pay,route,notes,start_date,end_date,active,subfleets,fares,fields'.split(",")]));
    window.localStorage.setItem("pairs", JSON.stringify(['dep_icao,arr_icao,flights'.split(",")]));
    load(JSON.parse(window.localStorage.getItem("pairs")));
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

    let warn = confirm("Are you sure you want to add this pair? Added pairs cannot be individually deleted!");
    if(warn == 1)return;
    let data = JSON.parse(window.localStorage.getItem("pairs"));
    data.push([dep.toUpperCase(), arr.toUpperCase(), []]);
    window.localStorage.setItem("pairs", JSON.stringify(data));
    load(data);
  }

  function checkExist(data, dep, arr){
    let res = false
    for(i in data){
      if(dep == undefined || arr == undefined)continue;
        if(data[i][0].toString().toLowerCase() == dep.toString().toLowerCase() && data[i][1].toString().toLowerCase() == arr.toString().toLowerCase()){
            res = true;
            break;
        }
    }
    return res;
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


  function load(data) {
    document.getElementById("pairsInformation").innerHTML = `
  <tr>
    <th>Depature ICAO</th>
    <th>Arrival ICAO</th>
    <th># of Included Flights</th>
    <th>Actions</th>
  </tr>
      `
  
    for(i in data){
          if(i != 0 && data[i].length > 1){
              document.getElementById("pairsInformation").innerHTML += `
  <tr>
    <td>${data[i][0]}</td>
    <td>${data[i][1]}</td>
    <td>${data[i][2].length.toString()}</td>
    <td><button onClick="editPair(${i})">Edit Pair</button></td>
  </tr>
              `
          }
      }
  }
  

  function editPair(id){
    let data = JSON.parse(window.localStorage.getItem("pairs"));
    window.localStorage.removeItem("editPair");
    window.localStorage.setItem("editPair", JSON.stringify(data[id]));
    window.location.href = './editPairs.html'
  }