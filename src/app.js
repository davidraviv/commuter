var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
// var Accel = require('ui/accel');
var Vibe = require('ui/vibe');
var Settings = require('settings');

var parseFeed = function(data) {
  var items = [];
  var quantity = Settings.option('stations') || 4;
  for(var i = 0; i < quantity; i++) {
    // parse out the station name and id
    var title = data.Payload[i].StationName;
    var id = data.Payload[i].StationID;
    
    // translate the title to english
    var titleEn = translate(title); //|| title;
    
    // Add to menu items array
    items.push({
      title: titleEn,
      subtitle: id,
      id: id
    });
  }

  // Finally return whole array
  return items;
};

var parseLines = function(data) {
  var items = [];
  var favouriteLines = Settings.option('lines') || ['1','40','51','68','240'];
  
  // make sure objects are valid and iterate over all bus lines
  if (data.Payload && data.Payload.Lines) {
    for(var i = 0; i < data.Payload.Lines.length; i++) {
      // parse out the line number and time
      if (favouriteLines.indexOf(data.Payload.Lines[i].LineSign) > -1) {
        var title = data.Payload.Lines[i].LineSign + ' (' + data.Payload.Lines[i].EstimationTime + ' min)';
        // Add to menu items array
        items.push({
          title: title
        });
      }
    }
  }
  
  // if no matches found
  if(items.length === 0) {
    items.push({
      title: 'No lines available'
    });
  }

  // Finally return whole array
  return items;
};

displayText('Getting location...', false);

var locationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function locationSuccess(pos) {
  var crd = pos.coords;
  console.debug('Lat: ' + crd.latitude + 'Lon:' + crd.longitude + 'Accuracy: ' + crd.accuracy);
// Text element to show position
  displayText(
    'lat: ' + crd.latitude + '\n' +
    'lon: ' + crd.longitude + '\n' +
    'accuracy: ' + crd.accuracy, 
    false);
  
  // now, that we have the location, get stations nearby
  console.info('getting list of stations nearby');
  ajax(
  {
    url: 'http://mabat.mot.gov.il/AdalyaService.svc/StationsByGEOGet',
    type: 'json',
    method: 'post',
    data: {
      "longitude": crd.longitude,
      "latitude": crd.latitude,
      "isStationWithTrain":false,
      "lang":1037
    }
  },
  function(data) {
//     console.debug(JSON.stringify(data,null,2));
    console.info('Got a list of nearby stations');
    
    // Create an array of Menu items
    var menuItems = parseFeed(data);
    
    // Construct Menu to show to user
    var resultsMenu = new UI.Menu({
      sections: [{
        title: 'Nearby stations',
        items: menuItems,
        font:'GOTHIC_28_BOLD'
      }]
    });
    
    // Add an action for SELECT
    resultsMenu.on('select', displayLinesInStation);
    
    // Show the Menu
    resultsMenu.show();
    Vibe.vibrate('short');
  },
  function(err) {
    console.error('ERROR (' + err.code + '): ' + err.message);  
  });
}

function error(err) {
  console.warn('ERROR (' + err.code + '): ' + err.message);
  displayText('ERROR: ' + err.message, false);
}

console.info('getting location');
navigator.geolocation.getCurrentPosition(locationSuccess, error, locationOptions);



//========================================================
// UTILS
// Should move to a seperate file once supported by pebble
//========================================================

/**
* Display a window with a text
**/
function displayText(text, isVibe) {
  // Create splash window
  var splashWindow = new UI.Window();
  
  // Create text element
  var textObj = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(144, 168),
    text:text,
    font:'GOTHIC_28_BOLD',
    color:'white',
    textOverflow:'wrap',
    textAlign:'left',
    backgroundColor:'black'
  });
  
  // Add to splashWindow and show
  splashWindow.add(textObj);
  splashWindow.show();
  
  // Vibrarte if asked to
  if (isVibe) {
    Vibe.vibrate('short');
  }
}

// TODO: I should translate all names synchronously
function translate(text) {
  console.debug('translating: ' + text);
  var trans = null;
  ajax(
    {
      url: 'https://www.googleapis.com/language/translate/v2?key=xxx&source=he&target=en&q='+text,
      type: 'json',
      async: false,
      cache: true
    },
    function(data) {
//       console.debug(JSON.stringify(data,null,2));
      trans = data.data.translations[0].translatedText;
    },
    function(err) {
      console.error('Error translating (' + err.code + '): ' + err.message);
      return null;
    });
  console.debug('translate returns: ' + trans);
  return trans;
}

function displayLinesInStation(selectedItem) {
  console.debug('selected item ' + selectedItem.item.id);
  ajax(
  {
    url: 'http://mabat.mot.gov.il/AdalyaService.svc/StationLinesByIdGet',
    type: 'json',
    method: 'post',
    cache: false,
    data: {
      "stationId": selectedItem.item.id,
      "isSIRI": true,
      "lang": 1037
    }
  },
  function(data) {
//     console.debug(JSON.stringify(data,null,2));
    console.info('got available lines, going to parse feed');
    
    // Create an array of Menu items
    var menuItems = parseLines(data);
    
    // Construct Menu to show to user
    var resultsMenu = new UI.Menu({
      sections: [{
        title: 'Upcoming lines',
        items: menuItems,
        font:'GOTHIC_28_BOLD'
      }]
    });
    
    // Add an action for SELECT
    resultsMenu.on('select', function(e){
      console.debug('Selected bus item ' + e.selectedIndex);
    });
    
    // Show the Menu
    resultsMenu.show();
  },
  function(err) {
    console.error('Error geting lines (' + err.code + '): ' + err.message);  
  });
}

//==========================
// STTINGS
// Should move to a seperate file once supported by pebble
//==========================
// Set a configurable with the open callback
Settings.config(
  { url: 'http://www.example.com',
    autoSave: true },
  function(e) {
    console.debug('opening configurable');

    // Reset color to red before opening the webview
    Settings.option('color', 'red');
    Settings.option('stations', '4');
    Settings.option('lines', ['1','40','51','68','240']);
  },
  function(e) {
    console.debug('closed configurable');
    var stations = Settings.option('stations');
    console.debug('number of stations: ' + stations);
  }
);
