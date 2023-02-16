
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

function editFlight(){
    alert("This feature is not yet available!")
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