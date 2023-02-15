
const { ipcRenderer } = require('electron');
const {dialog} = require('electron').remote;

$(function() {
  let data = JSON.parse(window.localStorage.getItem("airports"));
  if(data.length > 1){
    load(data)
  }
})

ipcRenderer.on('readAirportImport', (event, data) => {
    data = data.data;
    window.localStorage.setItem("airports", JSON.stringify(data));

    load(data)
});

function load(data) {
  document.getElementById("airportsInformation").innerHTML = `
<tr>
  <th>ICAO</th>
  <th>Name</th>
  <th>Actions</th>
</tr>
    `

  for(i in data){
        if(i != 0 && data[i].length > 1){
            document.getElementById("airportsInformation").innerHTML += `
<tr>
  <td>${data[i][0]}</td>
  <td>${data[i][2].replace(/"/g, "").replace(/<p>/g, "").replace(/<\/p>/g, "")}</td>
  <td><button onClick="edit(${i})">Edit</button><button onClick="deleteAirport(${i})">Delete</button></td>
</tr>
            `
        }
    }
}

ipcRenderer.on('exportAirport', (event, data) => {
  if(data.error == true){
    alert("An error occured!")
  }else{
    alert("Exported!")
  }
});

function deleteAirport(row){
  let data = JSON.parse(window.localStorage.getItem("airports"))
  data.splice(row, 1)
  window.localStorage.setItem("airports", JSON.stringify(data))
  load(JSON.parse(window.localStorage.getItem("airports")))
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

async function clearAirports(){
    console.log("test")

    let confirmed = false;
    
    if(document.getElementById("airportsInformation").rows.length > 1){
        let temp = await confirm("Are you sure you want to continue without saving?")
        confirmed = temp == 0 ? true : false;
    }else{
        confirmed = true;
    }

    if(confirmed == false)return;
    console.log("test")
    window.localStorage.setItem("airports", JSON.stringify(['icao,iata,name,location,country,timezone,hub,lat,lon,ground_handling_cost,fuel_100ll_cost,fuel_jeta_cost,fuel_mogas_cost,notes'.split(",")]));
    load(JSON.parse(window.localStorage.getItem("airports")))
}

function add(){
  let table = JSON.parse(window.localStorage.getItem("airports"));
  
  let row = 0;
  let result = ipcRenderer.sendSync('editAirportDialog', row, "ICAO", "", true, "")
  if(result.data == 501)return;
  let airport = ipcRenderer.sendSync('getAirportInfo', result.data)
  if(airport == 404)return alert("Airport not found!");	
  if(airportExist(airport["icao"]))return alert("Airport already exists!")
  let temp = []
  let data = JSON.parse(window.localStorage.getItem("airports"))
  temp.push(airport["icao"]);

  temp.push(airport["iata"]);

  temp.push(airport["name"]);

  temp.push(airport["servedCity"]);

  temp.push(airport["country"]["iso2"]);

  temp.push(airport["timeZone"]);

  let isHub = ipcRenderer.sendSync('editAirportDialog', row, "Hub(1 for yes, 0 for no)", "", true, 0)
  if(isHub.data == 501)return;
  isHub = isHub.data.toString() == "1" ? "1" : "0";
  temp.push(isHub);

  temp.push(airport["coordinates"]["latitude"]);

  temp.push(airport["coordinates"]["longitude"]);

  let groundHandlingCost = ipcRenderer.sendSync('editAirportDialog', row, "GroundHandlingCost", "", false)
  if(groundHandlingCost.data == 501)return;
  temp.push(groundHandlingCost.data);

  let f100llCost = ipcRenderer.sendSync('editAirportDialog', row, "100llFuelCost", "", false)
  if(f100llCost.data == 501)return;
  temp.push(f100llCost.data);

  let jetACost = ipcRenderer.sendSync('editAirportDialog', row, "jetAFuelCost", "", false)
  if(jetACost.data == 501)return;
  temp.push(jetACost.data);

  let mogasFuelCost = ipcRenderer.sendSync('editAirportDialog', row, "mogasFuelCost", "", false)
  if(mogasFuelCost.data == 501)return;
  temp.push(mogasFuelCost.data);

  let notes = ipcRenderer.sendSync('editAirportDialog', row, "airportNotes", "", false)
  if(notes.data == 501)return;
  temp.push(notes.data);

  if(data[data.length - 1].length <= 1){
    data.pop();
  }
  data.push(temp);
  data.push([""])
  window.localStorage.setItem("airports", JSON.stringify(data))
  load(JSON.parse(window.localStorage.getItem("airports")))
  alert("Done!")
  // table[row][collumn] = document.getElementById("airportsInformation").rows[row].cells[collumn].innerHTML;
}

function editAirport(row, collumn){
  let table = JSON.parse(window.localStorage.getItem("airports"));

  let result = ipcRenderer.sendSync('editAirportDialog', row, "ICAO", table[row][0], true, table[row][0])
  if(result.data == 501)return;
  let airport = ipcRenderer.sendSync('getAirportInfo', result.data)
  if(airport == 404)return alert("Airport not found!")	
  let rowNum = result.rowNum
  let data = JSON.parse(window.localStorage.getItem("airports"))
  data[rowNum][0] = airport["icao"];
  
  data[rowNum][1] = airport["iata"];

  data[rowNum][2] = airport["name"];
  
  data[rowNum][3] = airport["servedCity"];
  
  data[rowNum][4] = airport["country"]["iso2"];
  
  data[rowNum][5] = airport["timeZone"];

  data[rowNum][7] = airport["coordinates"]["latitude"];
  
  data[rowNum][8] = airport["coordinates"]["longitude"];

  let isHub = ipcRenderer.sendSync('editAirportDialog', row, "Hub(1 for yes, 0 for no)", table[row][6], true, table[row][6] == undefined ? 0 : table[row][6])
  if(isHub.data == 501)return;
  isHub = isHub.data.toString() == "1" ? "1" : "0";
  data[rowNum][6] = isHub;

  let groundHandlingCost = ipcRenderer.sendSync('editAirportDialog', row, "GroundHandlingCost", table[row][9], false)
  if(groundHandlingCost.data == 501)return;
  data[rowNum][9] = groundHandlingCost.data;

  let f100llCost = ipcRenderer.sendSync('editAirportDialog', row, "100llFuelCost", table[row][10], false)
  if(f100llCost.data == 501)return;
  data[rowNum][10] = groundHandlingCost.data;
  
  let jetACost = ipcRenderer.sendSync('editAirportDialog', row, "jetAFuelCost", table[row][11], false)
  if(jetACost.data == 501)return;
  data[rowNum][11] = jetACost.data;
  
  let mogasFuelCost = ipcRenderer.sendSync('editAirportDialog', row, "mogasFuelCost", table[row][12], false)
  if(mogasFuelCost.data == 501)return;
  data[rowNum][12] = mogasFuelCost.data;
  
  let notes = ipcRenderer.sendSync('editAirportDialog', row, "airportNotes", table[row][13], false)
  if(notes.data == 501)return;
  data[rowNum][13] = notes.data;

  

  window.localStorage.setItem("airports", JSON.stringify(data))
  load(JSON.parse(window.localStorage.getItem("airports")))
  alert("Done!")
  // table[row][collumn] = document.getElementById("airportsInformation").rows[row].cells[collumn].innerHTML;


}

function edit(icaoRow) {
  let table = document.getElementById("airportsInformation");
  editAirport(icaoRow, 0, table.rows[icaoRow].cells[0].innerHTML.toString())
  // ipcRenderer.send('editAirport', icaoRow)
}

function exportCSV() {
    var oRows = document.getElementById('airportsInformation').getElementsByTagName('tr');
    var iRowCount = oRows.length;
    if(iRowCount == 1){
        alert("There is nothing to export!")
        return;
    }
    let information = window.localStorage.getItem("airports");
    ipcRenderer.send('exportAirport', information)
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

async function importCSV() {

    let confirmed = false;
    
    if(document.getElementById("airportsInformation").rows.length > 1){
        let temp = await confirm("Are you sure you want to continue without saving?")
        confirmed = temp == 0 ? true : false;
    }else{
        confirmed = true;
    }

    if(confirmed == false)return
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'phpVMS Airports Export CSV', extensions: ['csv'] }
        ]
    }, function (files) {
        if (files !== undefined) {
            // handle files
            ipcRenderer.send('readAirportImport', files)
        }
    });
}


