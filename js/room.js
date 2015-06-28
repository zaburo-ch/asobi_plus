window.console.log = function(i){return;};
//-------------いろいろな変数の宣言-------------
var gMap = null;
var members = {};
var host;
var socket = null;
var socketReady = false;
var roomname = "";
var username = "";
var mycolor = 0;
var myid = "";
var memberCount = 0;
var mypeer = null;
var mypeerReady = false;
var geoWatchId;
var mymarker = null;
var openControl = null;
var closeControl = null;
var mylatlng = null;
var localStream = null;
var isDeviceReady = false;
//var audioWrapper = null;
var isVoiceReady = false;
var voiceControlDOM = null;
var targetMemberId = "";
var alertPopup = null;
var alertMessage = null;
var confirmResult = false;
var gamemode = 0;
var oniid = "";
var confirmOpen = false;
var confirmArray = [];
var existCheck = [];
var checktimeoutId;

//-------------定数-------------
var iconname = [
  "red",
  "blue",
  "yellow",
  "green",
  "black"
];

var modename = [
  "通常",
  "鬼ごっこ",
  "かくれんぼ",
  "ケイドロ/ドロケイ",
];

//-------------Alertのpopup化-------------
function initAlert(){
  alert = function(str,cfunc){
    var timerId = setInterval(function(){
      if($.mobile.activePage){
        clearInterval(timerId);
        openAlertPopup(str,cfunc);
      }
    },100);
  };
}

function openAlertPopup(str,cfunc){
  closeOtherPopup();
  setAlertPopup();
  var timerId;
  alertMessage.text(str);
  alertPopup.unbind();
  alertPopup.bind({
    popupafteropen:function(event, ui){
      clearInterval(timerId);
    },
    popupafterclose:function(event, ui){
      if(cfunc){
        cfunc();
      }
    }
  });
  timerId = setInterval(function(){
    alertPopup.popup('open');
  },100);
}

function setAlertPopup(){
  var popupId = $.mobile.activePage.attr('id');
  alertMessage = $("#alert_message_on"+popupId);
  alertPopup = $("#alert_popup_on"+popupId);
}

function closeOtherPopup(){
  if($.mobile.activePage.attr('id')=="member"){
    $("#qrpopup").popup('close');
    $("#card_popup").popup('close');
  }
}


//-------------confirmのpopup化-------------
function initConfirm(){
  confirm = function(str,sfunc,ffunc){
    var timerId = setInterval(function(){
      if($.mobile.activePage){
        clearInterval(timerId);
        if(confirmOpen){
          confirmArray.push({
            "str":str,
            "sfunc":sfunc,
            "ffunc":ffunc
          });
        }else{
          confirmOpen = true;
          openConfirmPopup(str,sfunc,ffunc);
        }
      }
    },100);
  };
}

function openConfirmPopup(str,sfunc,ffunc){
  closeOtherPopup();
  setConfirmPopup();
  var timerId;
  alertMessage.text(str);
  alertPopup.unbind();
  alertPopup.bind({
    popupafteropen:function(event, ui){
      clearInterval(timerId);
    },
    popupafterclose:function(event, ui){
      if(confirmResult){
        if(sfunc) sfunc();
      }else{
        if(ffunc) ffunc();
      }
      confirmResult = false;
      if(confirmArray.length>0){
        openConfirmPopup(
          confirmArray[0].str,
          confirmArray[0].sfunc,
          confirmArray[0].ffunc
        );
        confirmArray.splice(0,1);
      }else{
        confirmOpen = false;
      }
    }
  });
  timerId = setInterval(function(){
    alertPopup.popup('open');
  },100);
}

function confirmOK(){
  confirmResult = true;
}

function setConfirmPopup(){
  var popupId = $.mobile.activePage.attr('id');
  console.log("#confirm_message_on"+popupId);
  alertMessage = $("#confirm_message_on"+popupId);
  alertPopup = $("#confirm_popup_on"+popupId);
}

//-------------init-------------
function init(){
  //退出イベント
  disconnectEvent();
  //alertの置き換え
  initAlert();
  initConfirm();
  //PageTransition設定
  $.mobile.defaultPageTransition = "none";
  ////audioWrapperの取得
  //audioWrapper = $("#wrapper");
  //地図のセット
  $(document).on('pageshow','#map', drawMap );
  //ベンダープレフィックスいろいろ
  preparePrefix();
  //WSの準備(通信スタート)
  if(setParameter()){
    prepareWS();
  }
  //位置情報取得開始
  setGeoCallback();
  //コネクションチェック
  connectionCheck();
}
init();

//-------------ベンダープレフィックスいろいろ-------------
function preparePrefix(){
  navigator.getUserMedia = navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia;
  window.URL = window.URL || window.webkitURL;
}

//-------------地図初期化等-------------
function drawMap(){
  if (gMap === null){
    initMapM();
    initMapControl();
  }
}

function initMapM(){
  var height = $(window).height() - $('#map [data-role="header"]').height() - $('#map [data-role="footer"]').height() - 45;
  $("#mMap").css('height',height);
  var latlng = new google.maps.LatLng(35.709984, 139.810703);
  var opts = {
    "zoom": 16,
    "center": latlng,
    "mapTypeId": google.maps.MapTypeId.ROADMAP,
    "panControl": false,
    "zoomControl": true,
    "zoomControlOptions":{"position": google.maps.ControlPosition.LEFT_BOTTOM},
    "mapTypeControl": false,
    "scaleControl": true,
    "streetViewControl": false,
    "overviewMapControl": false
  };
  gMap = new google.maps.Map(document.getElementById('mMap'), opts);
}

//-------------地図のコントロールまわり-------------
function initMapControl(){
  openControl = $("#open_control");
  openControl.append('<img src="centering.png" class="control_btn" onclick="controlCentering();" />');
  openControl.append('<div class="control_border" style="float:left"/>');
  voiceControlDOM = $('<img src="voice_off.png" class="control_btn" onclick="controlVoice();" />');
  openControl.append(voiceControlDOM);
  openControl.append('<div id="control_opt" style="float:left"></div>');
  openControl.append('<div class="control_border" style="float:left"/>');
  openControl.append('<img src="close_control.png" class="control_btn" onclick="controlClose();" />');

  closeControl = $("#close_control");
  closeControl.append('<img src="open_control.png" onclick="controlOpen();" />');
}

function controlClose(){
  openControl.css({'visibility':'hidden'});
  closeControl.css({'visibility':'visible'});
}

function controlOpen(){
  openControl.css({'visibility':'visible'});
  closeControl.css({'visibility':'hidden'});
}

function controlVoice(){
  if(isVoiceReady){
    stopVoiceShare();
    voiceControlDOM.attr("src","voice_off.png");
  }else{
    startVioceShare(function(){
      voiceControlDOM.attr("src","voice_on.png");
    });
  }
  isVoiceReady = !isVoiceReady;
}

function controlCentering(){
  gMap.setCenter(mylatlng);
}

function controlOni(){
  emitData({
    "type":"oni_change",
    "from":myid
  });
  alert("鬼になりました。");
  if(members[oniid]){
    members[oniid].sharePos = true;
  }
  oniid = "";
}

//-------------MemberViewまわり-------------
function addMemberView(name,id,color){
  if($("#"+id).length) return;
  var wrapper = $("<div>",{"id":id});
  wrapper.addClass("bg_white").addClass('padding10').addClass("card_shadow");
  wrapper.append('<img src="'+iconname[color]+'.png" class="marker_center">');
  wrapper.append('<div style="margin-left:40px"><div class="card_name">'+name+'</div><div class="card_id">id:'+id+'</div></div>');
  wrapper.click(function(){
    var posImgStr = "";
    if(members[id].sharePos) posImgStr="pos_on.png";
    else posImgStr="pos_off.png";
    var voImgStr = "";
    if(members[id].call) voImgStr="voice_on.png";
    else voImgStr="voice_off.png";
    $('#card_control_pos').attr("src",posImgStr);
    $('#card_control_pos').unbind();
    $('#card_control_pos').click(function(){cardControlPos(id);});
    $('#card_control_vo').attr("src",voImgStr);
    $('#card_control_vo').unbind();
    $('#card_control_vo').click(function(){cardControlVo(id);});
    $('#card_popup').popup('open');
  });
  $("#wrap_members").append(wrapper);
}

function removeMemberView(id){
  if($("#"+id).length){
    $("#"+id).remove();
  }
}

function cardControlPos(id){
  if(members[id].marker){
    members[id].marker.setMap(null);
    members[id].marker = null;
    $('#card_control_pos').attr("src","pos_off.png");
    members[id].sharePos = false;
    members[id].conn.send({
      "type":"pos_switch",
      "from":myid
    });
  }else{
    members[id].conn.send({
      "type":"pos_switch",
      "from":myid,
      "isShare":true
    });
    $('#card_control_pos').attr("src","pos_on.png");
  }
}

function cardControlVo(id){
  if(members[id].call){
    members[id].conn.send({
      "type":"stream_stop",
      "from":myid,
    });
    members[id].call.close();
    members[id].call = null;
    //TODO
    members[id].audio.pause();
    members[id].audio = null;
    $('#card_control_vo').attr("src","voice_off.png");
  }else{
    if(isDeviceReady){
      members[id].conn.send({
        "type":"stream_ready",
        "from":myid,
        "color":mycolor,
        "card":true
      });
      $('#card_control_vo').attr("src","voice_on.png");
    }else{
      $('#card_popup').popup('close');
      alert("音声がONになっていません。地図上の音声アイコンをタップして音声をONにしてください");
    }
  }
}
//-------------Memberまわり-------------
function Member() { // Connection Class
  this.self = this;
  this.name = "";
  this.id = "";
  this.color = 0;
  this.conn = null;
  this.connReady = false;
  this.marker = null;
  this.audio = null;
  this.sharePos = true;
  this.call = null;
}

function addMember(id, member) {
  members[id] = member;
}

function removeMember(id){
  if(members[id].conn){
    members[id].conn = null;
  }
  if(members[id].marker){
    members[id].marker.setMap(null);
    members[id].marker = null;
  }
  removeMemberView(id);
  delete members[id];
}

function prepareNewMember(name,id,color){
  var mem = new Member();
  mem.name = name;
  mem.id = id;
  mem.color = color;
  addMember(id,mem);
}

//-------------DataConnectionまわり-------------
function prepareNewConnection(id){
  var timerId = setInterval(function(){
    if(mypeerReady){
      clearInterval(timerId);
      members[id].conn = mypeer.connect(id);
      members[id].conn.on('open',function(){
        console.log('connection to '+id+' open.');
        addMemberView(members[id].name,id,members[id].color);
        members[id].connReady = true;
        members[id].conn.send({
          "type":"connection open",
          "from":myid
        });
      });
      members[id].conn.on('data',onConnectionData);
      /*
      //TODO:DataChannelが勝手にcloseしたときの処理
      members[id].conn._dc.onclose = function(e) {
        console.log('DataChannel closed for!!!!!:', self.peer);
        members[id].conn._dc.close();
      };
      */
    }
  },1000);
}

function onConnectionData(data){
  console.log("on data");
  var id = data.from;
  switch(data.type){
  case "connection open":
    console.log("connection to "+id+" open");
    break;
  case "geo data":
    console.log("get geo data from "+id);
    var latlng = new google.maps.LatLng(data.x,data.y);
    if(members[id].marker){
      if(gamemode==2){
        //かくれんぼの位置情報処理
        var d = cal_distance(
          mylatlng.lat(),
          mylatlng.lng(),
          data.x,
          data.y
        );
        console.log(d);
        if(d<50){
          ringBell();
        }
      }else if((gamemode==3)&&(members[id].color!=mycolor)){
        //ケイドロの位置情報処理
        var d = cal_distance(
          mylatlng.lat(),
          mylatlng.lng(),
          data.x,
          data.y
        );
        if(members[id].marker.getVisible()){
          if(d>100){
            members[id].marker.setVisible(false);
          }
        }else{
          if(d<100){
            members[id].marker.setVisible(true);
            ringBell();
          }
        }
      }
      members[id].marker.setPosition(latlng);
    }else{
      if((members[id].sharePos)&&(gMap)){
        var icon = new google.maps.MarkerImage(
          iconname[members[id].color]+".png",
          new google.maps.Size(30, 30),
          new google.maps.Point(0,0),
          new google.maps.Point(15,15)
        );
        members[id].marker = new google.maps.Marker({
          "position": latlng,
          "map": gMap,
          "icon": icon
        });
      }
    }
    /*
    if((gamemode==2)&&(members[id].marker)){
      var d = cal_distance
      if(members[id].marker.getVisible()){

      }
    }*/
    break;
  case "stream_ready":
    console.log("get stream signal from "+id);
    if(isDeviceReady&&!members[id].call){
      if(mycolor==data.color){
        console.log("test");
        members[id].call = mypeer.call(id,localStream);
        setOnStream(id);
      }else if(data.card){
        confirm(members[id].name+"さんが音声共有を要求しています。応じますか？",
          function(){
            members[id].call = mypeer.call(id,localStream);
            setOnStream(id);
          },
          function(){
            members[id].conn.send({
              "type":"call_reject",
              "from":myid,
            });
          }
        );
      }
    }else{
      if(data.card){
        members[id].conn.send({
          "type":"stream_not_ready",
          "from":myid,
        });
      }
    }
    break;
  case "stream_stop":
    console.log("get stream stop signal from "+id);
    if(members[id].call){
      members[id].call = null;
      if(members[id].audio){
        //TODO
        members[id].audio.pause();
        members[id].audio = null;
      }
    }
    break;
  case "call_reject":
    console.log("call rejected by "+id);
    alert(members[id].name+"さんに音声共有を断られました。");
    break;
  case "stream_not_ready":
    console.log("stream not ready "+id);
    alert(members[id].name+"さんは音声共有をONにしていません。");
    break;
  case "pos_switch":
    console.log("pos switch "+data.isShare+","+id);
    if(data.isShare){
      confirm(members[id].name+"さんが位置情報共有を要求しています。応じますか？",
        function(){
          members[id].sharePos = true;
          members[id].conn.send({
            "type":"pos_share_accept",
            "from":myid,
          });
        },
        function(){
          members[id].conn.send({
            "type":"pos_share_reject",
            "from":myid,
          });
        }
      );
    }else{
      members[id].sharePos = false;
      if(members[id].marker){
        members[id].marker.setMap(null);
        members[id].marker = null;
      }
    }
    break;
  case "pos_share_accept":
    console.log("pos share request is accepted by "+id);
    members[id].sharePos = true;
    break;
  case "pos_share_reject":
    console.log("pos share request is rejected by "+id);
    alert(members[id].name+"さんは位置情報共有を断られました。");
    break;
  case "mode_selected":
    console.log("mode "+data.mode+" is seleceted");
    if(data.mode==gamemode) break;
    confirm(members[id].name+"さんが"+modename[data.mode]+"モードを開始しました。参加しますか？",
      function(){
        console.log("test!!!");
        if(gamemode!=0){
          endMode(gamemode);
        }
        settingMode(data.mode);
        gamemode = data.mode;
      }
    );
    break;
  case "oni_change":
    console.log("oni is "+id);
    if(members[oniid]){
      members[oniid].sharePos = true;
    }
    members[id].sharePos = false;
    if(members[id].marker){
      members[id].marker.setMap(null);
      members[id].marker = null;
    }
    oniid = id;
    alert(members[id].name+"さんが鬼になりました。");
    break;
  }
}

function setOnStream(id){
  console.log("set onStream");
  members[id].call.on('stream', function(stream) {
    console.log("add stream from "+id);
    /*
    members[id].audio = $("<audio>",{
//      "autoplay":true,
      "src":window.URL.createObjectURL(stream)
    });*/
    members[id].audio = document.createElement("audio");
    members[id].audio.src = window.URL.createObjectURL(stream);
    confirm(
      members[id].name+"さんから音声通話が届きました。通話開始します。",
      function(){
        members[id].audio.play();
      },
      function(){
        members[id].conn.send({
          "type":"stream_stop",
          "from":myid,
        });
        members[id].call.close();
        members[id].call = null;
        //TODO
        members[id].audio.pause();
        members[id].audio = null;
      }
    );
    //audioWrapper.append(audio);
  });
}

function emitData(data){
  for(var id in members){
    if(members[id].connReady){
      members[id].conn.send(data);
    }
  }
}

//-------------ソケットまわり-------------
function prepareWS(){
  host = location.origin.replace(/^http/, 'ws');
  socket = new WebSocket(host);
  socket.onopen = onOpen;
  socket.onmessage = onMessage;
  socket.onclose = onClose;

  //socket.ioとの互換、emitは諦め
  socket.json = {};
  socket.json.send = function(data){
    socket.send(JSON.stringify(data));
  };
}

function onOpen(evt) {
  console.log('socket opened.');
  socketReady = true;
  socket.send(JSON.stringify({"type":"enter_room","roomname":roomname,"username":username,"color":mycolor}));
}

function onMessage(event) {
  var evt = JSON.parse(event.data);
  switch(evt.type){
  case "welcome":
    console.log("entered room. my id is "+evt.from);
    myid = evt.from;
    setMyPeer(evt.from);
    break;
  case "enter_room":
    if(members[evt.from]) break;
    console.log("add member "+evt.name+":"+evt.color+":"+evt.from);
    prepareNewMember(evt.name,evt.from,evt.color);
    memberCount++;
    socket.json.send({"type":"i_exist","name":username,"color":mycolor,"sendto": evt.from });
    break;
  case "disconnect":
    console.log("remove member " + evt.from);
    removeMember(evt.from);
    memberCount--;
    break;
  case "i_exist":
    if(members[evt.from]) break;
    console.log("add member "+evt.name+":"+evt.color+":"+evt.from);
    prepareNewMember(evt.name,evt.from,evt.color);
    prepareNewConnection(evt.from);
    memberCount++;
    break;
  case "call":
    console.log("call from "+evt.from);
    socket.json.send({"type":"call_back","name":username,"color":mycolor,"sendto": evt.from });
    break;
  case "call_back":
    if(members[evt.from]){
      console.log("call back from "+evt.from);
      existCheck.push(evt.from);
    }else{
      console.log("add member "+evt.name+":"+evt.color+":"+evt.from);
      prepareNewMember(evt.name,evt.from,evt.color);
      prepareNewConnection(evt.from);
      memberCount++;
      clearTimeout(checktimeoutId);
    }
    break;
  }
}

function onClose(){
  console.log("websocket close");
  socketReady = false;
  var timerId = setInterval(function(){
    if(!socketReady){
      socket = new WebSocket(host);
      socket.onopen = onReopen;
      socket.onmessage = onMessage;
      socket.json = {};
      socket.json.send = function(data){
        socket.send(JSON.stringify(data));
      };
    }else{
      clearInterval(timerId);
      socket.onclose = onClose;
    }
  },1000);
}

function onReopen(evt){
  console.log('socket reopened.');
  socketReady = true;
  socket.send(JSON.stringify({"type":"reopen","roomname":roomname,"id":myid}));
}

//-------------?以下を取得-------------
function setParameter() {
  var url = document.location.href;
  if(url.match(/username=([^&]+)/)){
    try{
      username = decodeURI(RegExp.$1);
    }catch(e){
      username="";
    }
  }
  if(url.match(/roomname=([^&]+)/)){
    try{
      roomname = decodeURI(RegExp.$1);
    }catch(e){
      roomname = "";
    }
  }
  if(url.match(/color=([^&]+)/)){
    mycolor = parseInt(RegExp.$1,0);
  }
  if(username===""||roomname===""){
    alert('パラメータが正しくありません',function(){
      location.href = "index.html?username="+username+"&roomname="+roomname+"&color="+mycolor;
    });
    return false;
  }
  console.log(username+"("+mycolor+") enters "+roomname);
  $('#qrcode').qrcode(location.origin+"/index.html?roomname="+encodeURI(roomname));
  return true;
}

//-------------mypeerまわり-------------
function setMyPeer(id){
  mypeer = new Peer(id,{
    key:'your key',
    config:{'iceServers':[{url:'stun:stun.l.google.com:19302'}]}
  });
  mypeer.on('open', function(id) {
    console.log('mypeer open');
    mypeerReady = true;
  });
  mypeer.on('connection', function(conn) {
    members[conn.peer].conn = conn;
    members[conn.peer].connReady = true;
    addMemberView(members[conn.peer].name,conn.peer,members[conn.peer].color);
    conn.on('data',onConnectionData);
  });
  mypeer.on('call', function(call) {
    members[call.peer].call = call;
    setOnStream(call.peer);
    call.answer(localStream);
  });
}

//-------------位置情報取得-------------
function setGeoCallback(){
  var geolocation;
  try {
    if(typeof(navigator.geolocation) == 'undefined'){
      geolocation = google.gears.factory.create('beta.geolocation');
    } else {
      geolocation = navigator.geolocation;
    }
  } catch(e) {}
  var success = function (position) {
    console.log("i'm at "+position.coords.latitude+":"+position.coords.longitude);
    mylatlng = new google.maps.LatLng(
      position.coords.latitude,position.coords.longitude);
    if(gMap){
      if(mymarker){
        mymarker.setPosition(mylatlng);
      }else{
        gMap.setCenter(mylatlng);
        var icon = new google.maps.MarkerImage(
          iconname[mycolor]+".png",
          new google.maps.Size(30, 30),
          new google.maps.Point(0,0),
          new google.maps.Point(15,15)
        );
        mymarker = new google.maps.Marker({
          "position": mylatlng,
          "map": gMap,
          "icon": icon
        });
      }
    }
    emitData({
      "type":"geo data",
      "from":myid,
      "x":position.coords.latitude,
      "y":position.coords.longitude
    });
  };
  var error = function (error) {
    console.log("failed to get geo data");
  };
  var option = {
    enableHighAccuracy: true,
    timeout : 10000,
    maximumAge: 0
  };
  geoWatchId = geolocation.watchPosition(success, error, option);
}

//-------------音声ストリーム-------------
function startVioceShare(func){
  navigator.getUserMedia({video: false, audio: true},
    function (stream) { // success
      localStream = stream;
      isDeviceReady = true;
      emitData({
        "type":"stream_ready",
        "from":myid,
        "color":mycolor
      });
      if(func) func();
    },
    function (error) { // error
      console.error('An error occurred: [CODE ' + error.code + ']');
    }
  );
}

function stopVoiceShare(){
  isDeviceReady = false;
  localStream = null;
  //firefoxでcloseイベントをサポートしていないのでシグナルを送る
  emitData({
    "type":"stream_stop",
    "from":myid
  });
  for(var id in members){
    if(members[id].call){
      members[id].call.close();
      members[id].call = null;
      members[id].audio.pause();
      members[id].audio = null;
    }
  }
  //audioWrapper.empty();
}

//-------------モード-------------
function selectMode(mode){
  emitData({
    "type":"mode_selected",
    "from":myid,
    "mode":mode
  });
  if(gamemode!=0){
    endMode(gamemode);
  }
  settingMode(mode);
  gamemode = mode;
}

function settingMode(mode){
  if(mode==1){
    //鬼ごっこ
    $("#control_opt").append('<div class="control_border" style="float:left"/>');
    $("#control_opt").append('<img src="oni.png" class="control_btn" onclick="controlOni();" />');
  }else if(mode==2){
    for(var id in members){
      if(members[id].marker){
        members[id].marker.setVisible(false);
      }
    }
  }else if(mode==3){
    for(var id in members){
      if((members[id].marker)&&(members[id].color!=mycolor)){
        members[id].marker.setVisible(false);
      }
    }
  }
  alert(modename[mode]+"モードになりました。");
  $("#mode_btn"+mode).text("このモードを終える");
  $("#mode_btn"+mode).attr("onclick","endMode("+mode+");");
}

function endMode(mode){
  if(mode==1){
    //鬼ごっこ
    $("#control_opt").empty();
    if(members[oniid]){
      members[oniid].sharePos = true;
    }
    oniid = "";
  }else if(mode==2){
    for(var id in members){
      if(members[id].marker){
        members[id].marker.setVisible(true);
      }
    }
  }else if(mode==3){
    for(var id in members){
      if((members[id].marker)&&(members[id].color!=mycolor)){
        members[id].marker.setVisible(true);
      }
    }
  }
  $("#mode_btn"+mode).text("このモードにする");
  $("#mode_btn"+mode).attr("onclick","selectMode("+mode+");");
  gamemode = 0;
}

//-------------距離計算-------------
function cal_distance(lat1, lon1, lat2, lon2){
  var a_lat = lat1 * Math.PI / 180;
  var a_lon = lon1 * Math.PI / 180;
  var b_lat = lat2 * Math.PI / 180;
  var b_lon = lon2 * Math.PI / 180;

  var latave = (a_lat + b_lat) / 2;
  var latidiff = a_lat - b_lat;
  var longdiff = a_lon - b_lon;

  var meridian = 6335439 / Math.sqrt(Math.pow(1 - 0.006694 * Math.sin(latave) * Math.sin(latave), 3));
  var primevertical = 6378137 / Math.sqrt(1 - 0.006694 * Math.sin(latave) * Math.sin(latave));
  var x = meridian * latidiff;
  var y = primevertical * Math.cos(latave) * longdiff;

  return Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
}

//-------------退出イベント-------------
function disconnectEvent(){
  $(window).bind('beforeunload', function(event) {
    socket.json.send({"type":"disconnect"});
  });
}

//-------------音鳴らす-------------
function ringBell(){
  if(navigator.vibrate){
    navigator.vibrate([300, 300, 300, 300, 300]);
  }
}

//-------------定期チェック-------------
function connectionCheck(){
  var timerId = setInterval(function(){
    existCheck = [];
    checktimeoutId = setTimeout(function(){
      for(var id in members){
        var isExisting = false;
        console.log("exist check");
        for(var j in existCheck){
          console.log(existCheck[j]+" is existing");
          if(id==existCheck[j]){
            isExisting = true;
            break;
          }
        }
        if(!isExisting){
          console.log("remove member " + id);
          removeMember(id);
          memberCount--;
        }
      }
    },5000);
    socket.json.send({"type":"call"});
    for(var id in members){
      if(!(members[id].conn&&members[id].conn.open)){
        members[id].conn = mypeer.connect(id);
        members[id].conn.on('open',function(){
          console.log('connection to '+id+' open.');
          if($('#'+id).size()==0){
            addMemberView(members[id].name,id,members[id].color);
          }
          members[id].connReady = true;
          members[id].conn.send({
            "type":"connection open",
            "from":myid
          });
        });
        members[id].conn.on('data',onConnectionData);
      }
    }
  },10000);
}