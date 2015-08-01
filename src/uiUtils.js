var UI = require('ui');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');

function display(text, isVibe) {
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
