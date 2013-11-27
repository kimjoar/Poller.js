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
            dataType: 'json'
        });
    };

    Poller.prototype._connected = function(data) {
        if (typeof data.uuid === 'string') {
            this.uuid = data.uuid;
            this.readyState = OPEN;
            this.onopen();
            this._poll();
        } else {
            this._fail();
        }
    };

    Poller.prototype._fail = function() {
        this.onerror();
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
            if (data) that.onmessage({ data: data });
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

    return Poller;

}));
