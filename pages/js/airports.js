// * Description: The javascript file for the airports page


// * Run when the page is loaded
$(function() {
  let data = JSON.parse(window.localStorage.getItem("airports"));

  // If data is not empty, load the data
  if(data.length > 1){
    load(data)
  }
})

// * Run when the user clicks the import button
ipcRenderer.on('readAirportImport', (event, data) => {
    data = data.data;
    window.localStorage.setItem("airports", JSON.stringify(data));

    load(data)
});

// * Load data into table
// @param data - The data to load
function load(data) {
  // Reset the table before operation
  document.getElementById("airportsInformation").innerHTML = `
<tr>
  <th>ICAO</th>
  <th>Name</th>
  <th>Actions</th>
</tr>
    `

  // Loop through the data, and add a row with the information of each airport
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

// * Run when the user clicks the export button
// @param data - The data to export
ipcRenderer.on('exportAirport', (event, data) => {
  if(data.error == true){
    alert("An error occured!")
  }else{
    alert("Exported!")
  }
});

// * Run when the user clicks to delete an airport
// @param row - The row of the airport to delete
function deleteAirport(row){
  let data = JSON.parse(window.localStorage.getItem("airports"))
  // removes the airport with the row number
  data.splice(row, 1)
  window.localStorage.setItem("airports", JSON.stringify(data))

  // loads the new data
  load(JSON.parse(window.localStorage.getItem("airports")))
}

// * Check if an airport exists in the database
// @param icao - The ICAO of the airport to check
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

// * Run when the user clicks the clear button
async function clearAirports(){

  // Check if the user wants to continue without saving
  let confirmed = false;
  if(document.getElementById("airportsInformation").rows.length > 1){
      let temp = await confirm("Are you sure you want to continue without saving?")
      confirmed = temp == 0 ? true : false;
  }else{
      confirmed = true;
  }

  if(confirmed == false)return;
  window.localStorage.setItem("airports", JSON.stringify(['icao,iata,name,location,country,timezone,hub,lat,lon,ground_handling_cost,fuel_100ll_cost,fuel_jeta_cost,fuel_mogas_cost,notes'.split(",")]));
  load(JSON.parse(window.localStorage.getItem("airports")))
}

// * Adds an airport
function add(){
  let row = 0;

  // Get the ICAO of the airport
  let result = ipcRenderer.sendSync('editAirportDialog', row, "ICAO", "", true, "")
  if(result.data == 501)return;

  // Get the airport information
  let airport = ipcRenderer.sendSync('getAirportInfo', result.data)
  if(airport == 404)return alert("Airport not found!");	

  // Check if the airport already exists in the database
  if(airportExist(airport["icao"]))return alert("Airport already exists!")

  let temp = []

  // Add the airport information to the array
  let data = JSON.parse(window.localStorage.getItem("airports"))
  temp.push(airport["icao"]);

  // Add the IATA code to the array
  temp.push(airport["iata"]);

  // Add the name of the airport to the array
  temp.push(airport["name"]);

  // Add the location of the airport to the array
  temp.push(airport["servedCity"]);

  // Add the country of the airport to the array
  temp.push(airport["country"]["iso2"]);

  // Add the timezone of the airport to the array
  temp.push(airport["timeZone"]);

  // Add the hub status of the airport to the array
  let isHub = ipcRenderer.sendSync('editAirportDialog', row, "Hub(1 for yes, 0 for no)", "", true, 0)
  if(isHub.data == 501)return;
  isHub = isHub.data.toString() == "1" ? "1" : "";
  temp.push(isHub);

  // Add the latitude and longitude of the airport to the array
  temp.push(airport["coordinates"]["latitude"]);
  temp.push(airport["coordinates"]["longitude"]);

  // Add the ground handling cost of the airport to the array
  let groundHandlingCost = ipcRenderer.sendSync('editAirportDialog', row, "GroundHandlingCost", "", false)
  if(groundHandlingCost.data == 501)return;
  temp.push(groundHandlingCost.data);

  // Add the fuel costs of the airport to the array
  let f100llCost = ipcRenderer.sendSync('editAirportDialog', row, "100llFuelCost", "", false)
  if(f100llCost.data == 501)return;
  temp.push(f100llCost.data);
  let jetACost = ipcRenderer.sendSync('editAirportDialog', row, "jetAFuelCost", "", false)
  if(jetACost.data == 501)return;
  temp.push(jetACost.data);
  let mogasFuelCost = ipcRenderer.sendSync('editAirportDialog', row, "mogasFuelCost", "", false)
  if(mogasFuelCost.data == 501)return;
  temp.push(mogasFuelCost.data);

  // Add the notes of the airport to the array
  let notes = ipcRenderer.sendSync('editAirportDialog', row, "airportNotes", "", false)
  if(notes.data == 501)return;
  temp.push(notes.data);

  // Removes last element if it is empty
  if(data[data.length - 1].length <= 1){
    data.pop();
  }

  // Add the airport to the database
  data.push(temp);

  // Add empty row to the database
  data.push([""]);

  // Save the database
  window.localStorage.setItem("airports", JSON.stringify(data))

  // Load the database
  load(JSON.parse(window.localStorage.getItem("airports")))
  alert("Done!")
}

// * Run when the user clicks the edit button
// @param row - The row of the airport to edit
function editAirport(row){
  // Reads the data from the local storage
  let table = JSON.parse(window.localStorage.getItem("airports"));

  // Gets the ICAO of the airport
  let result = ipcRenderer.sendSync('editAirportDialog', row, "ICAO", table[row][0], true, table[row][0])
  if(result.data == 501)return;

  // Gets the airport information
  let airport = ipcRenderer.sendSync('getAirportInfo', result.data)
  if(airport == 404)return alert("Airport not found!")	

  // Adds the airport information to the array
  let rowNum = result.rowNum
  let data = JSON.parse(window.localStorage.getItem("airports"))
  data[rowNum][0] = airport["icao"];
  
  // Adds the IATA code to the array
  data[rowNum][1] = airport["iata"];

  // Adds the name of the airport to the array
  data[rowNum][2] = airport["name"];
  
  // Adds the location of the airport to the array
  data[rowNum][3] = airport["servedCity"];
  
  // Adds the country of the airport to the array
  data[rowNum][4] = airport["country"]["iso2"];
  
  // Adds the timezone of the airport to the array
  data[rowNum][5] = airport["timeZone"];

  // Adds the latitude and longitude of the airport to the array
  data[rowNum][7] = airport["coordinates"]["latitude"];
  data[rowNum][8] = airport["coordinates"]["longitude"];

  // Adds the notes of the airport to the array
  let isHub = ipcRenderer.sendSync('editAirportDialog', row, "Hub(1 for yes, 0 for no)", table[row][6], true, table[row][6] == undefined ? 0 : table[row][6])
  if(isHub.data == 501)return;
  isHub = isHub.data.toString() == "1" ? "1" : "";
  data[rowNum][6] = isHub;

  // Adds the notes of the airport to the array
  let groundHandlingCost = ipcRenderer.sendSync('editAirportDialog', row, "GroundHandlingCost", table[row][9], false)
  if(groundHandlingCost.data == 501)return;
  data[rowNum][9] = groundHandlingCost.data;

  // Adds the fuel costs of the airport to the array
  let f100llCost = ipcRenderer.sendSync('editAirportDialog', row, "100llFuelCost", table[row][10], false)
  if(f100llCost.data == 501)return;
  data[rowNum][10] = groundHandlingCost.data;
  let jetACost = ipcRenderer.sendSync('editAirportDialog', row, "jetAFuelCost", table[row][11], false)
  if(jetACost.data == 501)return;
  data[rowNum][11] = jetACost.data;
  let mogasFuelCost = ipcRenderer.sendSync('editAirportDialog', row, "mogasFuelCost", table[row][12], false)
  if(mogasFuelCost.data == 501)return;
  data[rowNum][12] = mogasFuelCost.data;
  
  // Adds the notes of the airport to the array
  let notes = ipcRenderer.sendSync('editAirportDialog', row, "airportNotes", table[row][13], false)
  if(notes.data == 501)return;
  data[rowNum][13] = notes.data;

  // Set the data to the local storage
  window.localStorage.setItem("airports", JSON.stringify(data))

  // Load the database
  load(JSON.parse(window.localStorage.getItem("airports")))
  alert("Done!")
  // table[row][collumn] = document.getElementById("airportsInformation").rows[row].cells[collumn].innerHTML;


}

// * Run when the user clicks the edit button
// @param icaoRow - The row of the airport to edit
function edit(icaoRow) {
  let table = document.getElementById("airportsInformation");
  editAirport(icaoRow, 0, table.rows[icaoRow].cells[0].innerHTML.toString())
  // ipcRenderer.send('editAirport', icaoRow)
}

// * Run when the user clicks the delete button
function exportCSV() {
  // Checking if there is anything to export
  var oRows = document.getElementById('airportsInformation').getElementsByTagName('tr');
  var iRowCount = oRows.length;
  if(iRowCount == 1){
      alert("There is nothing to export!")
      return;
  }

  // Getting the data from the local storage and sending it to the main process
  let information = window.localStorage.getItem("airports");
  ipcRenderer.send('exportAirport', information)
}


// * Run when the user clicks the menu button
async function menu() {
  window.location.href = '../index.html'
}

// * Run when the user clicks the import button
async function importCSV() {

  // Checking if there is anything to import
  let confirmed = false;
  if(document.getElementById("airportsInformation").rows.length > 1){
      let temp = await confirm("Are you sure you want to continue without saving?")
      confirmed = temp == 0 ? true : false;
  }else{
      confirmed = true;
  }
  if(confirmed == false)return
   
  // Opening the file dialog
  let files = ipcRenderer.sendSync("dialog", "showOpenDialog", {
    properties: ['openFile'],
    filters: [
        { name: 'phpVMS Airports Export CSV', extensions: ['csv'] }
    ]
  })

  // Checking if the user selected a file
  if (files !== undefined) {
      // handle files
      ipcRenderer.send('readAirportImport', files.filePaths)
  }
}
