ASOBI+
====
昔ながらのあそびに最新の技術をプラスして最高に楽しくするWebアプリです。  
WebRTCを用いてブラウザ上でP2P通信を実現します。  
実際に動いているものは[こちら](http://asobi.herokuapp.com/)  

簡単な説明
----
このアプリはindex.htmlとroom.htmlの2つのページからなります。  
クライアント側のほとんどの処理はroom.jsに記述されていて、  
init()で各種初期化や入出処理を行い、その後は  
WebSocketやWebRTCで送られてきた情報に従って各動作を実行しています。  

サーバー側の動作を記述しているのはindex.jsで、  
サーバーはWebSocketでユーザーと繋がりWebRTCのための情報の中継をしています。  


ここに置いてあるコードについて
----
Herokuで動いているものとほぼ全て同じもの、同じ構成で置いています。  
APIkeyを公開する訳にはいかないので、room.jsのAPI KEYをセットする部分のみ  
```
key:'your key',
```
としています。  



ライセンス
----
PeerJS is licensed under the [MIT license](LICENSE.md).  

このソースコードには下記のライセンスの下配布されているコードを含みます。  
jQuery | Copyright (c) 2005, 2014 jQuery Foundation, Inc.  ([MIT](https://github.com/jquery/jquery/blob/master/LICENSE.txt))  
jQuery Mobile | Copyright (c) 2010, 2014 jQuery Foundation, Inc.  ([MIT](https://github.com/jquery/jquery-mobile/blob/master/LICENSE.txt))  
PeerJS | Copyright (c) 2015 Michelle Bu and Eric Zhang ([MIT](https://github.com/peers/peerjs/blob/master/LICENSE))  
jquery-qrcode | Copyright (c) 2011 Jerome Etienne ([MIT](https://github.com/jeromeetienne/jquery-qrcode/blob/master/MIT-LICENSE.txt))  

作者
----
Kaizaburo Chubachi

連絡先
----
[Email](https://github.com/zaburo-ch)  
[ブログ](https://zaburo-ch.github.io/)  
