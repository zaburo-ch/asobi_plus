var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log("websocket server created");

var rooms = {};
var roomnames = {};
var navi = {};
var offerFilter = {};

wss.on("connection", function(ws) {
  ws.on('message', function(str) {
    //console.log(str);
    var data = JSON.parse(str);
    //console.log(data);
    if(data.type=="enter_room"){
      if(!rooms[data.roomname]){
        rooms[data.roomname] = [];
      }
      ws.id = UUID();
      rooms[data.roomname].push(ws);
      roomnames[ws.id] = data.roomname;
      ws.send(JSON.stringify({
        "type":"welcome",
        "from":ws.id
      }));
      emitMessage(JSON.stringify({
        "type":"enter_room",
        "from":ws.id,
        "name":data.username,
        "color":data.color
      }));
    }else if(data.type=="reopen"){
      if(!rooms[data.roomname]){
        rooms[data.roomname] = [];
      }
      ws.id = data.id;
      rooms[data.roomname].push(ws);
      roomnames[ws.id] = data.roomname;
    }else{
      data.from = ws.id;
      var target = data.sendto;
      var roomname = roomnames[ws.id];
      if(target){
        for(var i=0;i<rooms[roomname].length;i++){
          if(rooms[roomname][i].id==target){
            rooms[roomname][i].send(JSON.stringify(data));
            break;
          }
        }
      }else{
        emitMessage(JSON.stringify(data));
      }
    }
  });

  function emitMessage(message){
    var roomname = roomnames[ws.id];
    if(!rooms[roomname]) return;
    for(var i=0;i<rooms[roomname].length;i++){
      if(rooms[roomname][i]==ws) continue;
      if(rooms[roomname][i])
        rooms[roomname][i].send(message);
    }
  }

  console.log("websocket connection open");

  ws.on("close", function() {
    console.log("websocket connection close");
    var roomname = roomnames[ws.id];
    if(!rooms[roomname]) return;
    for(var i=0;i<rooms[roomname].length;i++){
      if(rooms[roomname][i]==ws){
        rooms[roomname].splice(i,1);
        break;
      }
    }
  });
});

function UUID() {
  var uuid = [
    (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    (((1+Math.random())*0x10000)|0).toString(16).substring(1),
    (((1+Math.random())*0x10000)|0).toString(16).substring(1)
  ].join("");
  return uuid;
}
