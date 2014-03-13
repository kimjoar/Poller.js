(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // amd
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        // Node.js or CommonJS
        var $;
        try { $ = require('jquery'); } catch(e) {}
        factory($);
    } else {
        // browser global
        root.Poller = factory(root.jQuery);
    }

}(this, function ($) {
    'use strict';

    var CONNECTING = 0,
        OPEN = 1,
        CLOSING = 2,
        CLOSED = 3;

    var Poller = function(url) {
        this.url = url;
        this.readyState = CONNECTING;

        var connected = this._connected.bind(this);
        var fail = this._fail.bind(this);

        this._connect().then(connected, fail);
    };

    Poller.prototype._connect = function() {
        return $.ajax({
            url: this.url,
            dataType: 'text'
        });
    };

    Poller.prototype._connected = function(data) {
        if (typeof data === 'string' && data.trim() !== "") {
            this.uuid = data;
            this.readyState = OPEN;
            this.dispatchEvent({ type: 'open' });
            this.onopen();
            this._poll();
        } else {
            this._fail();
        }
    };

    Poller.prototype._fail = function() {
        this.dispatchEvent({ type: 'error' });
        this.onerror();
        this.dispatchEvent({ type: 'close' });
        this.onclose();
    };

    Poller.prototype._poll = function() {
        if (this.readyState !== OPEN) return;

        var that = this;

        $.ajax({
            url: this.url + "/" + this.uuid,
            dataType: 'text',
            timeout: 30000,
            cache: false
        }).then(function(data) {
            if (data) {
                that.dispatchEvent({ type: 'message', data: data });
                that.onmessage({ data: data });
            }
            that._poll();
        }, function(jqXHR, textStatus) {
            if (textStatus === 'timeout') {
                that._poll();
            } else {
                that._fail();
            }
        });
    };

    Poller.prototype.close = function() {
        if (this.readyState === CLOSING || this.readyState === CLOSED) return;

        this.readyState = CLOSING;

        var that = this;

        $.ajax({
            url: this.url + "/" + this.uuid,
            type: 'DELETE'
        }).then(function() {
            delete that.uuid;
            that.readyState = CLOSED;
            that.onclose();
        }, function() {
            delete that.uuid;
            that.readyState = CLOSED;
            that._fail();
        });
    };

    Poller.prototype.send = function(data) {
        if (this.readyState !== OPEN) return;

        var that = this;

        $.ajax({
            url: this.url + "/" + this.uuid,
            type: 'POST',
            data: data,
            contentType: 'text/plain'
        }).then(function() {
            // a-ok
        }, function() {
            // failed
            that.onerror();
        });
    };

    // defaults
    Poller.prototype.onopen = function() {};
    Poller.prototype.onerror = function() {};
    Poller.prototype.onmessage = function() {};
    Poller.prototype.onclose = function() {};

    /*! (C) WebReflection - Mit Style License */
    /* https://github.com/WebReflection/event-target */
    var EventTarget = (function () {
      var
        PREFIX = "@@",
        EventTarget = {},
        descriptor = {
          // in ES5 does not bother with enumeration
          configurable: true,
          value: null
        },
        defineProperty = Object.defineProperty ||
        function defineProperty(obj, prop, desc) {
          // in ES3 obj.hasOwnProperty() in for/in loops
          // is still mandatory since there's no way
          // to simulate non enumerable properties
          obj[prop] = desc.value;
        },
        indexOf = [].indexOf || function indexOf(value) {
          var i = this.length;
          while (i-- && this[i] !== value) {}
          return i;
        },
        has = EventTarget.hasOwnProperty;

      function configure(obj, prop, value) {
        descriptor.value = value;
        defineProperty(obj, prop, descriptor);
        descriptor.value = null;
      }

      function on(self, type, listener) {
        var array;
        if (has.call(self, type)) {
          array = self[type];
        } else {
          configure(self, type, array = []);
        }
        if (indexOf.call(array, listener) < 0) {
          array.push(listener);
        }
      }

      function dispatch(self, type, evt) {
        var array, current, i;
        if (has.call(self, type)) {
          evt.target = self;
          array = self[type].slice(0);
          for (i = 0; i < array.length; i++) {
            current = array[i];
            if (typeof current === "function") {
              current.call(self, evt);
            } else if (typeof current.handleEvent === "function") {
              current.handleEvent(evt);
            }
          }
        }
      }

      function off(self, type, listener) {
        var array, i;
        if (has.call(self, type)) {
          array = self[type];
          i = indexOf.call(array, listener);
          if (-1 < i) {
            array.splice(i, 1);
            if (!array.length) {
              delete self[type];
            }
          }
        }
      }

      configure(
        EventTarget,
        "addEventListener",
        function addEventListener(type, listener) {
          on(this, PREFIX + type, listener);
        }
      );

      configure(
        EventTarget,
        "dispatchEvent",
        function dispatchEvent(evt) {
          dispatch(this, PREFIX + evt.type, evt);
        }
      );

      configure(
        EventTarget,
        "removeEventListener",
        function removeEventListener(type, listener) {
          off(this, PREFIX + type, listener);
        }
      );

      return EventTarget;

    }())

    Poller.prototype.addEventListener = EventTarget.addEventListener;
    Poller.prototype.removeEventListener = EventTarget.removeEventListener;
    Poller.prototype.dispatchEvent = EventTarget.dispatchEvent;

    return Poller;


}));
