var UI = require('ui');
// var ajax = require('ajax');
var Vector2 = require('vector2');
// var Accel = require('ui/accel');
var Vibe = require('ui/vibe');


function display(text, isVibe) {
  // Show splash screen while waiting for data
  var splashWindow = new UI.Window();
  
  // Text element to inform user
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
  
  if (isVibe) {
    Vibe.vibrate('short');
  }
}
