(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // amd
        define(['underscore', 'jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        // Node.js or CommonJS
        var _ = require('underscore'), $;
        try { $ = require('jquery'); } catch(e) {};
        factory(_, $);
    } else {
        // browser global
        root.Poller = factory(root._, root.jQuery);
    }

}(this, function (_, $) {
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

        this._connect().then(function(data, textStatus, jqXHR) {
            var statusCode = jqXHR.statusCode();
            if (data.uuid) {
                that.uuid = data.uuid;
                that.onopen();
                that._poll();
            } else {
                that.onerror();
                that.onclose();
            }
        }, function() {
            that.onerror();
            that.onclose();
        });
    };

    Poller.prototype._connect = function() {
        return $.ajax({
            url: this.url,
            dataType: 'json'
        });
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
            that.onmessage({ data: data });
            that._poll();
        }, function() {
            that.onerror();
            that._poll();
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
            that.onerror();
            that.onclose();
        });
    };

    // external api
    Poller.prototype.send = function(data) {
        var that = this;

        $.ajax({
            url: this.url + "/" + this.uuid,
            type: 'POST',
            data: data
        }).then(function() {
            // a-ok
        }, function() {
            // failed
            that.onerror();
        });;
    };

    Poller.prototype.onopen = function() {};
    Poller.prototype.onerror = function() {};
    Poller.prototype.onmessage = function() {};
    Poller.prototype.onclose = function() {};

    return Poller;


}));
