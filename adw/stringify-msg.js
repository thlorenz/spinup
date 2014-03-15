'use strict';

var go = module.exports = function (json) {
  var msg, s = '';

  try { 
    msg = JSON.parse(json); 
  } catch (err) {
    return json; 
  }

  if (msg.stream) return msg.stream.replace('\n', ' ');
  if (msg.status) { 
    s = msg.status;
    if (msg.progress) s += ' ' + msg.progress;
    return s;
  }
  return JSON.stringify(msg, null, 2);
}
