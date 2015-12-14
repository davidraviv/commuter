var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
// var Accel = require('ui/accel');
var Vibe = require('ui/vibe');
var Settings = require('settings');

var cache = Settings.data('stationCache') || {};
var isCacheUpdated = false;
console.info('----- Starting Commuter -----');
console.info('Station cache: ' + JSON.stringify(cache,null,2));
// Settings.option('stations','[]');
console.info('Favorite stations: ' + (Settings.option('stations') ? JSON.stringify(Settings.option('stations')) : 'None'));
console.info('Favorite lines: ' + (Settings.option('lines') ? JSON.stringify(Settings.option('lines')) : 'None'));
console.info('-----------------------------');

var currentWindow = null;

var parseFeed = function(data) {
  var items = [];
  var quantity = 4; //Settings.option('stations') || 4;
  for(var i = 0; i < quantity; i++) {
    // parse out the station name and id
    var title = data.Payload[i].StationName;
    var id = data.Payload[i].StationID;
    
    // translate the title to english
    var titleEn = translate(id, title); //|| title;
    
    // Add to menu items array
    items.push({
      title: titleEn,
      subtitle: id,
      id: id
    });
  }

  //TODO this should be done in the event of the app shutdown
  if(isCacheUpdated) {
    console.debug('saving cache');
    Settings.data('stationCache', cache);
  }
  
  // if no matches found
  if(items.length === 0) {
    items.push({
      title: 'No stations available'
    });
  }

  // Finally return whole array
  return items;
};

var parseLines = function(data) {
  var favItems = [];
  var restItems = [];
  var favoriteLines = Settings.option('lines') ? JSON.parse(Settings.option('lines')) : [];
//   console.log('favorite lines: ' + JSON.stringify(favoriteLines));
  // make sure objects are valid and iterate over all bus lines
  if (data.Payload && data.Payload.Lines) {
    for(var i = 0; i < data.Payload.Lines.length; i++) {
      // parse out the line number and time
      var item = {
        id: data.Payload.Lines[i].LineSign,
        title: data.Payload.Lines[i].LineSign + ' (' + data.Payload.Lines[i].EstimationTime + ' min)'
      };
      if (favoriteLines.indexOf(data.Payload.Lines[i].LineSign) > -1) {
        item.icon = 'images/favorite_10x10.png';
        favItems.push(item);
      } else {
        restItems.push(item);
      }
    }
  }
  // join rest of items to favorite items (favorites first)
  var items = favItems.concat(restItems);

  // if no matches found
  if(items.length === 0) {
    items.push({
      title: 'No lines available'
    });
  }
//   console.log('lines parsed: ' + JSON.stringify(items,null,2));
  // Finally return whole array
  return items;
};

currentWindow = displayText('Getting location...', currentWindow, false);

var locationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 1000 * 60 // 1 minute
};

function locationSuccess(pos) {
  var crd = pos.coords;
  console.debug('Lat: ' + crd.latitude + 'Lon:' + crd.longitude + 'Accuracy: ' + crd.accuracy);
// Text element to show position
  currentWindow = displayText(
//     'lat: ' + crd.latitude + '\n' +
//     'lon: ' + crd.longitude + '\n' +
    'accuracy: ' + crd.accuracy, 
    currentWindow, false);
  
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
//      console.debug(JSON.stringify(data,null,2));
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
    currentWindow.hide();
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
function displayText(text, previousWindow, isVibe) {
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
  if (previousWindow) {
    previousWindow.hide();
  }
  
  // Vibrarte if asked to
  if (isVibe) {
    Vibe.vibrate('short');
  }
  return splashWindow;
}

// TODO: I should translate all names synchronously
function translate(key, text) {
  console.debug('translating id ' + key + ', text: ' + text);
  var trans = cache[key];
  if (trans) {
    console.debug('transltated from cache: ' + trans);
  } else {
    //TODO split the text by "/". translate each part seperately and concat the results adding the "/" again.
    ajax(
      {
        url: 'https://www.googleapis.com/language/translate/v2?key=AIzaSyCh_FQm5rTOTPNnFGCB5rwrIeTg0pj8h-M&source=he&target=en&q='+text,
        type: 'json',
        async: false,
        cache: true
      },
      function(data) {
  //       console.debug(JSON.stringify(data,null,2));
        trans = data.data.translations[0].translatedText;
        console.debug('translated using google: ' + trans);
        cache[key] = trans;
        isCacheUpdated = true;
      },
      function(err) {
        console.error('Error translating (' + err.code + '): ' + err.message);
        return null;
      });
  }
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
    
    // When long selecting a line, toggle favoriting it
    resultsMenu.on('longSelect', function(e){
      var lines = Settings.option('lines') ? JSON.parse(Settings.option('lines')) : [];
      console.log('Current favorite lines: ' + JSON.stringify(lines));
      var index = lines.indexOf(e.item.id);
      if(index > -1) {
        // removing line from favorites
        lines.splice(index, 1);
        console.debug('Removing line ' + e.item.id + ' from favorites: ' + JSON.stringify(lines));
      } else {
        // adding line to favorites
        lines.push(e.item.id);
        console.debug('Adding line ' + e.item.id + ' to favorites: ' + JSON.stringify(lines));
      }
      Settings.option('lines', JSON.stringify(lines));
      Vibe.vibrate('short');
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
// TODO this is commented out as I dont have a way to initialize the webview with the current content of setting
// Set a configurable with the open callback
// Settings.config(
//   { url: 'http://pebble-config.herokuapp.com/config?title=Commuter&fields=Lines,Stations',
//     autoSave: true },
//   function(e) {
//     // This is called when config web page is open
//     console.debug('opening configurable');
//   },
//   function(e) {
//     // This is called when config page is closed
//     console.debug('closed configurable');
//     console.log('Back from config page: ' + e.response);
//     var res = JSON.parse(e.response);
//     Settings.option('stations', res.Stations);
//     Settings.option('lines', res.Lines);
//   }
// );
