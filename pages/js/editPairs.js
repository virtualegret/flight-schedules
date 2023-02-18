// * Description: The javascript file for the edit pairs page


// * Load the flight data from the local storage
$(function() {
  let data = JSON.parse(window.localStorage.getItem("editPair"));
  if(data.length <= 1){
    window.location.href = "./pairs.html";
  }
  load(JSON.parse(window.localStorage.getItem("editPair")));
})

// * Function to go back to the pairs page
function back(){
    window.localStorage.removeItem("editPair")
    window.location.href = "./pairs.html"
}

// * Function to edit the flight
// @params index - The index of the flight in the local storage
function editFlight(index){
    let flightRoute = getFlightRoute(index);
    if(typeof flightRoute == "number")return alert("An error(" + flightRoute + ") occured while trying to get the flight route. Please try again later.");
    console.log(flightRoute)
}

// * Function to load the flight data
// @param data - The data from the local storage
function load(data){
    // Get the flights from the local storage
    let flights = JSON.parse(window.localStorage.getItem("flights"));

    // Get the flights information table
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

    // Loop through the flights and add them to the table
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


// * Function to get the flight route
// @params index - The index of the flight in the local storage
function getFlightRoute(index){
    // Get the flights from the local storage and find the flight data
    let flights = JSON.parse(window.localStorage.getItem("flights"));
    let flightData = ipcRenderer.sendSync("findFlightData", flights[index][5], flights[index][6]);
    // check if there is an error
    if(typeof flightData == "number")return flightData;

    // Get the flight id, while trying to safe more rate limits for the user.
    let flightId;
    if(flightData.length == 0){
        let newFlightData = ipcRenderer.sendSync("createFlightData", flights[index][5], flights[index][6]);
        if(typeof newFlightData == "number")return newFlightData;
        flightId = newFlightData["id"];
    }else{  
        // Get the most popular flight route
        let top = 0;
        let topIndex = 0;
        for(i in flightData){
            let data = flightData[i];
            if(data.popularity > top){
                top = data.popularity;
                topIndex = i;
            }
        }

        // Get the flight id
        flightId = flightData[topIndex]["id"];
    }

    // Get the flight route    
    let routeObject = ipcRenderer.sendSync("findFlightRoute", flightId)
    if(typeof routeObject == "number")return routeObject;

    // Convert the route object to a string
    let route = "";
    for(i in routeObject){
        route += routeObject[i]["ident"] + " "
    }

    // Remove the last space
    route = route.substring(0, route.length-1)

    // Return the flight route
    return route;
}
