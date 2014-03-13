Poller.js
=========

Long-polling library that adheres to the [WebSocket API](http://www.w3.org/TR/websockets/)

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
