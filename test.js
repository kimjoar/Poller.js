describe("poller", function() {
    var headers = { "Content-Type": "text/plain" };
    var data = "some data"
    var uuid = "123-123";

    it("immediately performs ajax request to root resource when creating a new instance", function() {
        var requests = allRequests(function() {
            var poller = new Poller("/test");
        });

        expect(requests.length).toEqual(1);
        expect(requests[0].url).toEqual("/test");
    });

    it("calls onopen if uuid is received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onopen = sinon.spy();

        requests[0].respond(200, headers, uuid);

        expect(poller.onopen.callCount).toBe(1);
    });

    it("calls open event if uuid is received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        var spy = sinon.spy();
        poller.addEventListener('open', spy);

        requests[0].respond(200, headers, uuid);

        expect(spy.callCount).toBe(1);
    });

    it("does not call onopen if uuid is *not* received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onopen = sinon.spy();

        requests[0].respond(200, headers, "");

        expect(poller.onopen.callCount).toBe(0);
    });

    it("calls onerror if connection fails", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onerror = sinon.spy();

        requests[0].respond(400, headers, "");

        expect(poller.onerror.callCount).toBe(1);
    });

    it("trigger error event if connection fails", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        var spy = sinon.spy();
        poller.addEventListener('error', spy);

        requests[0].respond(400, headers, "");

        expect(spy.callCount).toBe(1);
    });

    it("calls onclose if connection fails", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onclose = sinon.spy();

        requests[0].respond(400, headers, "");

        expect(poller.onclose.callCount).toBe(1);
    });

    it("trigger close event if connection fails", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        var spy = sinon.spy();
        poller.addEventListener('close', spy);

        requests[0].respond(400, headers, "");

        expect(spy.callCount).toBe(1);
    });

    it("calls onerror if uuid is *not* received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onerror = sinon.spy();

        requests[0].respond(200, headers, "");

        expect(poller.onerror.callCount).toBe(1);
    });

    it("calls onclose if uuid is *not* received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onclose = sinon.spy();

        requests[0].respond(200, headers, "");

        expect(poller.onclose.callCount).toBe(1);
    });

    it("performs poll request containing uuid when connection succeeds", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            requests[0].respond(200, headers, uuid);

            expect(requests.length).toBe(2);
            expect(requests[1].url).toContain("123-123");
        });
    });

    it("calls onmessage with received data if poll succeeds", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            poller.onmessage = sinon.spy();

            requests[0].respond(200, headers, uuid);
            requests[1].respond(200, headers, "some data");

            expect(poller.onmessage.callCount).toBe(1);
            expect(poller.onmessage.firstCall.args[0]).toEqual({ data: "some data" });
        });
    });

    it("triggers message event with received data if poll succeeds", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            var spy = sinon.spy();
            poller.addEventListener('message', spy);

            requests[0].respond(200, headers, uuid);
            requests[1].respond(200, headers, "some data");

            expect(spy.callCount).toBe(1);
            expect(spy.firstCall.args[0].data).toEqual("some data");
        });
    });

    it("performs new poll request when poll request succeeds", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            poller.onmessage = sinon.spy();

            requests[0].respond(200, headers, uuid);
            requests[1].respond(200, headers, data);
            requests[2].respond(200, headers, data);
            requests[3].respond(200, headers, data);

            expect(poller.onmessage.callCount).toBe(3);
        });
    });

    it("can remove message event listener", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            var spy = sinon.spy();
            poller.addEventListener('message', spy);

            requests[0].respond(200, headers, uuid);
            requests[1].respond(200, headers, data);
            requests[2].respond(200, headers, data);

            poller.removeEventListener('message', spy);

            requests[3].respond(200, headers, data);

            expect(spy.callCount).toBe(2);
        });
    });

    it("performs new poll request when request times out", function() {
        allRequests(function(requests) {
            var clock = sinon.useFakeTimers();

            var poller = new Poller("/test");

            poller.onmessage = sinon.spy();

            requests[0].respond(200, headers, uuid);
            requests[1].respond(200, headers, data);

            clock.tick(45000);

            // this request should time out
            requests[2].respond(200, headers, data);

            requests[3].respond(200, headers, data);
            requests[4].respond(200, headers, data);

            expect(poller.onmessage.callCount).toBe(3);

            clock.restore();
        });
    });

    it("does not perform new poll request when poll request fails", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            poller.onmessage = sinon.spy();
            poller.onerror = sinon.spy();

            requests[0].respond(200, headers, uuid);
            requests[1].respond(200, headers, data);
            requests[2].respond(400, headers, "");

            expect(requests.length).toBe(3);

            expect(poller.onerror.callCount).toBe(1);
            expect(poller.onmessage.callCount).toBe(1);
        });
    });

    it("performs DELETE when closing connection", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.onclose = sinon.spy();

            requests[0].respond(200, headers, uuid);

            poller.close();

            expect(requests.length).toEqual(3);
            expect(requests[2].url).toContain("123-123");
            expect(requests[2].method).toEqual("DELETE");
        });
    });

    it("does nothing when calling close on a closed connection", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.onclose = sinon.spy();

            requests[0].respond(200, headers, uuid);

            poller.close();
            poller.close();
            poller.close();

            expect(requests.length).toEqual(3);
        });
    });

    it("calls onclose when connection is closed", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.onclose = sinon.spy();

            requests[0].respond(200, headers, uuid);

            poller.close();

            expect(poller.onclose.callCount).toBe(0);

            requests[2].respond(204, headers, "");

            expect(poller.onclose.callCount).toBe(1);
        });
    });

    it("triggers close event when connection is closed", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            var spy = sinon.spy();
            poller.addEventListener('close', spy);

            requests[0].respond(200, headers, uuid);

            poller.close();

            requests[2].respond(204, headers, "");

            expect(spy.callCount).toBe(1);
        });
    });

    it("triggers close event when connection does close cleanly", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            var spy = sinon.spy();
            poller.addEventListener('close', spy);

            requests[0].respond(200, headers, uuid);

            poller.close();

            requests[2].respond(400);

            expect(spy.callCount).toBe(1);
        });
    });

    it("sends data as plain text", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.onclose = sinon.spy();

            requests[0].respond(200, headers, uuid);

            poller.send("testing this");

            expect(requests.length).toBe(3);
            expect(requests[2].url).toContain("123-123");
            expect(requests[2].method).toEqual("POST");
            expect(requests[2].requestBody).toEqual("testing this");
        });
    });

    it('does not open connection if close is called before connection is opened', function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.close();

            poller.onopen = sinon.spy();

            requests[0].respond(200, headers, uuid);

            expect(poller.onopen.callCount).toBe(0);
        });
    });

    it('triggers close event if close is called before connection is opened', function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            poller.onclose = sinon.spy();
            poller.close();

            requests[0].respond(200, headers, uuid);

            expect(poller.onclose.callCount).toBe(1);
        });
    });

    it("throws exception when trying to send data when connection is not set up", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            expect(function() {
                poller.send("testing");
            }).toThrow(new Error("Connection is not open"));
        });
    });


    function allRequests(callback) {
        var xhr = sinon.useFakeXMLHttpRequest();
        var requests = [];

        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };

        callback(requests);

        xhr.restore();

        return requests;
    }
});
