//var UI = require('ui');
// var ajax = require('ajax');
//var Vector2 = require('vector2');
// var Accel = require('ui/accel');
//var Vibe = require('ui/vibe');
// var uiUtils = require('./uiUtils');

// var parseFeed = function(data, quantity) {
//   var items = [];
//   for(var i = 0; i < quantity; i++) {
//     // Always upper case the description string
//     var title = data.list[i].weather[0].main;
//     title = title.charAt(0).toUpperCase() + title.substring(1);

//     // Get date/time substring
//     var time = data.list[i].dt_txt;
//     time = time.substring(time.indexOf('-') + 1, time.indexOf(':') + 3);

//     // Add to menu items array
//     items.push({
//       title:title,
//       subtitle:time
//     });
//   }

//   // Finally return whole array
//   return items;
// };

display('Getting location...', false);

var locationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function locationSuccess(pos) {
  var crd = pos.coords;
  console.debug('Lat: ' + crd.latitude + 'Lon:' + crd.longitude + 'Accuracy: ' + crd.accuracy);
// Text element to show position
  display(
    'lat: ' + crd.latitude + '\n' +
    'lon: ' + crd.longitude + '\n' +
    'accuracy: ' + crd.accuracy, 
    true);
  
  ajax(
  {
    url: 'http://mabat.mot.gov.il/AdalyaService.svc/StationsByGEOGet',
    type: 'json',
    method: 'post',
    data: {
      "longitude":34.7913681,
      "latitude":32.0701706,
      "isStationWithTrain":false,
      "lang":1037
    }
  },
  function(data) {
    console.debug(JSON.stringify(data,null,2));
  },
  function(err) {
    console.error('ERROR (' + err.code + '): ' + err.message);  
  });
}

function error(err) {
  console.warn('ERROR (' + err.code + '): ' + err.message);
  display('ERROR: ' + err.message, false);
}

console.debug('getting location');
navigator.geolocation.getCurrentPosition(locationSuccess, error, locationOptions);


// Make request to openweathermap.org
// ajax(
//   {
//     url:'http://api.openweathermap.org/data/2.5/forecast?q=London',
//     type:'json'
//   },
//   function(data) {
//     // Create an array of Menu items
//     var menuItems = parseFeed(data, 10);

//     // Construct Menu to show to user
//     var resultsMenu = new UI.Menu({
//       sections: [{
//         title: 'Current Forecast',
//         items: menuItems
//       }]
//     });

//     // Add an action for SELECT
//   resultsMenu.on('select', function(e) {
//   // Get that forecast
//   var forecast = data.list[e.itemIndex];

//   // Assemble body string
//   var content = data.list[e.itemIndex].weather[0].description;

//   // Capitalize first letter
//   content = content.charAt(0).toUpperCase() + content.substring(1);

//   // Add temperature, pressure etc
//   content += '\nTemperature: ' + Math.round(forecast.main.temp - 273.15) + '°C' +
//     '\nPressure: ' + Math.round(forecast.main.pressure) + ' mbar' +
//     '\nWind: ' + Math.round(forecast.wind.speed) + ' mph, ' + 
//     Math.round(forecast.wind.deg) + '°';

//       // Create the Card for detailed view
//       var detailCard = new UI.Card({
//         title:'Details',
//         subtitle:e.item.subtitle,
//         body: content
//       });
//       detailCard.show();
//     });

//     // Show the Menu, hide the splash
//     resultsMenu.show();
//     splashWindow.hide();
    
//     // Register for 'tap' events
//     resultsMenu.on('accelTap', function(e) {
//       // Make another request to openweathermap.org
//       ajax(
//         {
//           url:'http://api.openweathermap.org/data/2.5/forecast?q=London',
//           type:'json'
//         },
//         function(data) {
//           // Create an array of Menu items
//           var newItems = parseFeed(data, 10);
          
//           // Update the Menu's first section
//           resultsMenu.items(0, newItems);
          
//           // Notify the user
//           Vibe.vibrate('short');
//         },
//         function(error) {
//           console.log('Download failed: ' + error);
//         }
//       );
//     });
//   },
//   function(error) {
//     console.log("Download failed: " + error);
//   }
// );

// Prepare the accelerometer
// Accel.init();
