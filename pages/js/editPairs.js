
$(function() {
  let data = JSON.parse(window.localStorage.getItem("editPair"));
  if(data.length <= 1){
    window.location.href = "./pairs.html";
  }
  load(JSON.parse(window.localStorage.getItem("editPair")));
})


function back(){
    window.localStorage.removeItem("editPair")
    window.location.href = "./pairs.html"
}

function editFlight(index){
    let flightRoute = getFlightRoute(index);
    if(typeof flightRoute == "number")return alert("An error(" + flightRoute + ") occured while trying to get the flight route. Please try again later.");
    console.log(flightRoute)
}

function load(data){
    let flights = JSON.parse(window.localStorage.getItem("flights"));
    document.getElementById("flightsInformation").innerHTML = `
    <tr>
        <th>Flight Number</th>
        <th>Code</th>
        <th>Leg</th>
        <th>Departure ICAO</th>
        <th>Arrival ICAO</th>
        <th>Actions</th>
    </tr>
    `
    let fltNum = data[2];
    for(j in fltNum){
        for(i in flights){
            if((flights[i][0]+flights[i][1]).toString().toLowerCase() == fltNum[0].toString().toLowerCase()){
                document.getElementById("flightsInformation").innerHTML += `
                <tr>
                    <td>${flights[i][0]+flights[i][1]}</td>
                    <td>${flights[i][2]}</td>
                    <td>${flights[i][4]}</td>
                    <td>${flights[i][5]}</td>
                    <td>${flights[i][6]}</td>
                    <td><button onClick="editFlight(${i})">Edit Flight</button></td>
                </tr>
                `
            }
        }
    }
}


function getFlightRoute(index){
    let flights = JSON.parse(window.localStorage.getItem("flights"));
    let flightData = ipcRenderer.sendSync("findFlightData", flights[index][5], flights[index][6]);
    if(typeof flightData == "number")return flightData;
    let flightId;
    if(flightData.length == 0){
        let newFlightData = ipcRenderer.sendSync("createFlightData", flights[index][5], flights[index][6]);
        if(typeof newFlightData == "number")return newFlightData;
        flightId = newFlightData["id"];
    }else{  
        let top = 0;
        let topIndex = 0;
        for(i in flightData){
            let data = flightData[i];
            if(data.popularity > top){
                top = data.popularity;
                topIndex = i;
            }
        }
        flightId = flightData[topIndex]["id"];
    }

    
    let routeObject = ipcRenderer.sendSync("findFlightRoute", flightId)
    if(typeof routeObject == "number")return routeObject;

    let route = "";
    for(i in routeObject){
        route += routeObject[i]["ident"] + " "
    }
    route = route.substring(0, route.length-1)

    return route;
}
