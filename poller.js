const EventTarget = require("event-target-shim");
const $ = require("jquery");
const assign = require("object-assign");

const CONNECTING = 0,
      OPEN = 1,
      CLOSING = 2,
      CLOSED = 3;

const connect = (url) => {
    return $.ajax({
        url: url,
        dataType: 'text'
    });
}

const createEvent = (name, data = {}) => {
    let evt = document.createEvent("Event");
    let bubbles = false;
    let cancelable = false;
    evt.initEvent(name, bubbles, cancelable);
    assign(evt, data);
    return evt;
}

class Poller extends EventTarget("open", "error", "message", "close") {

    constructor(url) {
        super();

        this.url = url;
        this.readyState = CONNECTING;

        var connected = this._connected.bind(this);
        var fail = this._error.bind(this);

        this._currentConnection = connect(this.url);
        this._currentConnection.then(connected, fail);
    }

    _connected(data) {
        if (typeof data === 'string' && data.trim() !== "") {
            this.uuid = data;
            this.readyState = OPEN;
            this.dispatchEvent(createEvent("open"));
            this._poll();
        } else {
            this._error();
        }
    }

    _error() {
        this.dispatchEvent(createEvent("error"));
        this._close();
    }

    _poll() {
        if (this.readyState !== OPEN) return;

        $.ajax({
            url: this.url + "/" + this.uuid,
            dataType: 'text',
            timeout: 30000,
            cache: false
        }).then(
            (data) => {
                if (data) {
                    this.dispatchEvent(createEvent("message", { data: data }));
                }
                this._poll();
            },
            (jqXHR, textStatus) => {
                if (textStatus === 'timeout') {
                    this._poll();
                } else {
                    this._error();
                }
            }
        );
    }

    close() {
        if (this.readyState === CLOSING || this.readyState === CLOSED) return;
        if (this.readyState === CONNECTING) {
            this._currentConnection.abort();
            return;
        };

        this.readyState = CLOSING;
        var close = this._close.bind(this);

        $.ajax({
            url: this.url + "/" + this.uuid,
            type: 'DELETE'
        }).then(close, close);
    }

    _close() {
        delete this.uuid;
        this.readyState = CLOSED;
        this.dispatchEvent(createEvent("close"));
    }

    send(data) {
        if (this.readyState !== OPEN) {
            throw new Error("Connection is not open");
        }

        $.ajax({
            url: this.url + "/" + this.uuid,
            type: 'POST',
            data: data,
            contentType: 'text/plain'
        }).fail(() => {
            this.dispatchEvent(createEvent("error"));
        });
    }
}

module.exports = Poller;

