import axios from 'axios';
import {toStringHDMS} from 'ol/coordinate';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import {fromLonLat, toLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import View from 'ol/View';

init();
//Functions

function init(){

    let urlParams = new URLSearchParams(location.search);
    let lat = urlParams.get('lat');  
    let lon = urlParams.get('lon');  
    if(lat == null && lon == null){
        initGeolocation();
    }
    else{
        loadJson(parseFloat(lat), parseFloat(lon))
    }
}


function initGeolocation() {
  if (navigator && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback);
  } else {
    console.log('Geolocation is not supported');
  }
}
 
function successCallback(position) {
  let link = (
    'See the map at <a href="http://www.purpleair.com/map#11/' +
    position.coords.latitude+ '/' + position.coords.longitude + '">Purple Air</a>.'
  )
  document.getElementById('purpleairlink').innerHTML = link
  loadJson(position.coords.latitude, position.coords.longitude)
}

function loadJson(lat, lon) {
  axios({
  method:'get',
  url:'data/purpleair.json',
  responseType:'json'
})
  .then(function (response) {
    getSensorInfo(response['data'], lat, lon)
  });

}

function getSensorInfo(result, lat, lon){
  let sensors = result['results'];
  let recentSensors = getRecentSensors(sensors, lat, lon);
  getClosestSensor(recentSensors, lat, lon);
  getWorstSensor(recentSensors);
}

function getRecentSensors(sensors, lat, lon){
  let recentSensors = []
  sensors.forEach(function(obj){
    if(obj['DEVICE_LOCATIONTYPE'] == 'outside' &&
      (
        new Date(obj['LastSeen']*1000) > 
        new Date(Date.now() - (24 * 1000 * 60 * 60))
      )
    ){
      recentSensors.push(obj)
      let distance = getDistanceFromLatLonInKm(
        lat, lon, obj['Lat'], obj['Lon']
      )
      obj['distance'] = distance
    }
  })
  return recentSensors
}

function getClosestSensor(sensors, lat, lon){
    let distances = []
    sensors.forEach(function(obj){
      distances.push(obj['distance'])
    })
    let shortestDistance = Math.min(...distances)
    let shortestDistanceIndex = distances.indexOf(shortestDistance)
    let closestSensor = sensors[shortestDistanceIndex]
    console.log(
      'getClosest',
      closestSensor['Label'], 
      closestSensor['PM2_5Value'],
      new Date(closestSensor['LastSeen']*1000.0),
      shortestDistance, 
    )

    let positionHome = fromLonLat([lon,lat]);
    let positionClosestSensor = fromLonLat([
      parseFloat(closestSensor['Lon']),
      parseFloat(closestSensor['Lat'])
    ]);
    wearMaskStrUpdate(closestSensor)
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = (
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  ); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function getWorstSensor(sensors){
    console.log('getWorstSensor')
    var sensorValues = []
    sensors.forEach(function(obj){
      sensorValues.push(parseFloat(obj['PM2_5Value']))
    })
    let worstValue = Math.max(...sensorValues)
    let worstValueIndex = sensorValues.indexOf(worstValue)
    let worstSensor = sensors[worstValueIndex]
    console.log(
        'getWorstSensor',
        worstSensor['Label'], 
        worstSensor['PM2_5Value'],
        worstSensor['Lat'],
        worstSensor['Lon'],
        new Date(worstSensor['LastSeen']*1000.0),
        worstValue, 
    )
}

function wearMaskStrUpdate(closestSensor){
  let doIWearAMask;
  let airRating;
  let value = parseFloat(closestSensor['PM2_5Value'])
  if(value <= 50){
    doIWearAMask = 'No'
    airRating = 'Good'
    document.body.style.backgroundColor = 'green';
  }
  else if(value <= 100){
    doIWearAMask = 'Nah-ish'
    airRating = 'Moderate'
    document.body.style.backgroundColor = 'orange';
  }
  else if(value <= 150){
    doIWearAMask = 'Maybe'
    airRating = 'Unhealthy for sensitive groups'
    document.body.style.backgroundColor = 'orange';
  }
  else if(value <= 200){
    doIWearAMask = 'Yes'
    airRating = 'Unhealthy'
    document.body.style.backgroundColor = 'red';
  }
  else if(value < 250){
    doIWearAMask = 'Yes, and GO INSIDE'
    airRating = 'Very Unhealthy'
    document.body.style.backgroundColor = 'red';
  }
  else{
    doIWearAMask = 'Yes and GO INSIDE IMMEDIATELY'
    airRating = 'Hazardous'
    document.body.style.backgroundColor = 'red';
  }
  document.getElementById('header').innerHTML = (
    "<span id='maskStr'>" + doIWearAMask + "</span>."
  )
  document.getElementById('explanation').innerHTML = (
    " The PM 2.5 Level is " + value + " in " + closestSensor['Label'] + "."+ 
    " Rating: " + airRating + "." +
    " <span id='lastUpdateStr'>Last Update: " + new Date(closestSensor['LastSeen']*1000) + "</span>"
  )
}
