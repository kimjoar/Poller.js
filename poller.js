(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // amd
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        // Node.js or CommonJS
        try { $ = require('jquery'); } catch(e) {};
        factory($);
    } else {
        // browser global
        root.Poller = factory(root.jQuery);
    }

}(this, function ($) {
    'use strict';

    // GET /polling
    // -> 200: <uuid>
    //
    // GET /polling/<uuid>
    // -> timeout 30
    //
    // reconnects

    // var poller = new Poller("url");
    //
    // poller.send("test");
    //
    // poller.onopen = function() {}
    // poller.onerror = function() {}
    // poller.onmessage = function() {}
    // poller.onclose = function() {}

    var Poller = function(url) {
        this.url = url;

        var that = this;
        var fail = this._fail.bind(this);

        this._connect().then(function(data) {
            if (typeof data.uuid === 'string') {
                that.uuid = data.uuid;
                that.onopen();
                that._poll();
            } else {
                that._fail();
            }
        }, fail);
    };

    Poller.prototype._connect = function() {
        return $.ajax({
            url: this.url,
            dataType: 'json'
        });
    };

    Poller.prototype._fail = function() {
        this.onerror();
        this.onclose();
    };

    Poller.prototype._poll = function() {
        if (!this.uuid) return;

        var that = this;

        $.ajax({
            url: this.url + "/" + this.uuid,
            dataType: 'json',
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
        var that = this;

        $.ajax({
            url: this.url + "/" + this.uuid,
            type: 'DELETE'
        }).then(function() {
            delete that.uuid;
            that.onclose();
        }, function() {
            delete that.uuid;
            that._fail();
        });
    };

    Poller.prototype.send = function(data) {
        var that = this;

        $.ajax({
            url: this.url + "/" + this.uuid,
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json'
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
