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

    let warn = confirm("Are you sure you want to add this pair? Added pairs cannot be deleted!");
    if(warn == 1)return;
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
  