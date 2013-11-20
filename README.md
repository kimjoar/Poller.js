Poller.js
=========

Simple long-polling utility that follows the HTML5 Websockets API

```javascript
var poller = new Poller("url");

poller.onopen = function() {
    poller.send("test");
};

poller.onmessage = function(e) {
    console.log(e.data);
};

poller.onerror = function() {};
poller.onclose = function() {};
```
