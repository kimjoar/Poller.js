describe("poller", function() {
    var json = { "Content-Type": "application/json" };
    var data = JSON.stringify({ some: "data" });
    var noData = JSON.stringify({});
    var uuid = JSON.stringify({ uuid: "123-123" });

//    it("calls onopen when successfully connected", function() {
//        var server = sinon.fakeServer.create();
//
//        var statusCode = 200;
//        var headers = { "Content-Type": "application/json" };
//        var data = JSON.stringify({ uuid: "123-123" });
//
//        server.respondWith("GET", "/test", [statusCode, headers, data]);
//
//        var poller = new Poller("/test");
//        poller.onopen = sinon.spy();
//
//        server.respond();
//
//        expect(poller.onopen.callCount).toEqual(1);
//
//        server.restore();
//    });
//
//    it("calls onerror when connection fails", function() {
//        var server = sinon.fakeServer.create();
//
//        var statusCode = 400;
//        var headers = { "Content-Type": "application/json" };
//        var data = JSON.stringify({});
//
//        server.respondWith("GET", "/test", [statusCode, headers, data]);
//
//        var poller = new Poller("/test");
//        poller.onerror = sinon.spy();
//
//        server.respond();
//
//        expect(poller.onerror.callCount).toEqual(1);
//
//        server.restore();
//    });
//
//    it("calls onerror when connected but no uuid received", function() {
//        var server = sinon.fakeServer.create();
//
//        var statusCode = 200;
//        var headers = { "Content-Type": "application/json" };
//        var data = JSON.stringify({ something: "test" });
//
//        server.respondWith("GET", "/test", [statusCode, headers, data]);
//
//        var poller = new Poller("/test");
//        poller.onerror = sinon.spy();
//
//        server.respond();
//
//        expect(poller.onerror.callCount).toEqual(1);
//
//        server.restore();
//    });
//
//    it("calls onmessage when data received", function() {
//        var server = sinon.fakeServer.create();
//
//        var statusCode = 200;
//        var headers = { "Content-Type": "application/json" };
//        var uuid = JSON.stringify({ uuid: "123-123" });
//        var data = JSON.stringify({ some: "data" });
//
//        server.respondWith("GET", "/test", [statusCode, headers, uuid]);
//        server.respondWith("GET", "/test/123-123", [statusCode, headers, data]);
//
//        var poller = new Poller("/test");
//        poller.onmessage = sinon.spy();
//
//        server.respond();
//
//        expect(poller.onmessage.callCount).toEqual(1);
//
//        server.restore();
//    });
//
//    it("calls onmessage with received data", function() {
//        var server = sinon.fakeServer.create();
//
//        var statusCode = 200;
//        var headers = { "Content-Type": "application/json" };
//        var uuid = JSON.stringify({ uuid: "123-123" });
//        var data = JSON.stringify({ some: "data" });
//
//        server.respondWith("GET", "/test", [statusCode, headers, uuid]);
//        server.respondWith("GET", "/test/123-123", [statusCode, headers, data]);
//
//        var poller = new Poller("/test");
//        poller.onmessage = sinon.spy();
//
//        server.respond();
//
//        expect(poller.onmessage.firstCall.args[0]).toEqual({ some: "data" });
//
//        server.restore();
//    });

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

        requests[0].respond(200, json, uuid);

        expect(poller.onopen.callCount).toBe(1);
    });

    it("does not call onopen if uuid is *not* received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onopen = sinon.spy();

        requests[0].respond(200, json, noData);

        expect(poller.onopen.callCount).toBe(0);
    });

    it("calls onerror if connection fails", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onerror = sinon.spy();

        requests[0].respond(400, json, "");

        expect(poller.onerror.callCount).toBe(1);
    });

    it("calls onclose if connection fails", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onclose = sinon.spy();

        requests[0].respond(400, json, "");

        expect(poller.onclose.callCount).toBe(1);
    });

    it("calls onerror if uuid is *not* received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onerror = sinon.spy();

        requests[0].respond(200, json, noData);

        expect(poller.onerror.callCount).toBe(1);
    });

    it("calls onclose if uuid is *not* received in initial request", function() {
        var poller;

        var requests = allRequests(function() {
            poller = new Poller("/test");
        });

        poller.onclose = sinon.spy();

        requests[0].respond(200, json, noData);

        expect(poller.onclose.callCount).toBe(1);
    });

    it("performs poll request containing uuid when connection succeeds", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            requests[0].respond(200, json, uuid);

            expect(requests.length).toBe(2);
            expect(requests[1].url).toContain("123-123");
        });
    });

    it("calls onmessage with received data if poll succeeds", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            var data = { some: 'data' };

            poller.onmessage = sinon.spy();

            requests[0].respond(200, json, uuid);
            requests[1].respond(200, json, JSON.stringify(data));

            expect(poller.onmessage.callCount).toBe(1);
            expect(poller.onmessage.firstCall.args[0]).toEqual({ data: data });
        });
    });

    it("performs new poll request when poll request succeeds", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            poller.onmessage = sinon.spy();

            requests[0].respond(200, json, uuid);
            requests[1].respond(200, json, data);
            requests[2].respond(200, json, data);
            requests[3].respond(200, json, data);

            expect(poller.onmessage.callCount).toBe(3);
        });
    });

    it("performs new poll request when poll request fails", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");

            poller.onmessage = sinon.spy();
            poller.onerror = sinon.spy();

            requests[0].respond(200, json, uuid);
            requests[1].respond(200, json, data);
            requests[2].respond(400, json, "");
            requests[3].respond(200, json, data);

            expect(poller.onerror.callCount).toBe(1);
            expect(poller.onmessage.callCount).toBe(2);
        });
    });

    it("performs DELETE when closing connection", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.onclose = sinon.spy();

            requests[0].respond(200, json, uuid);

            poller.close();

            expect(requests.length).toEqual(3);
            expect(requests[2].url).toContain("123-123");
            expect(requests[2].method).toEqual("DELETE");
        });
    });

    it("calls onclose when connection is closed", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.onclose = sinon.spy();

            requests[0].respond(200, json, uuid);

            poller.close();

            expect(poller.onclose.callCount).toBe(0);

            requests[2].respond(204, json, "");

            expect(poller.onclose.callCount).toBe(1);
        });
    });

    it("sends data", function() {
        allRequests(function(requests) {
            var poller = new Poller("/test");
            poller.onclose = sinon.spy();

            requests[0].respond(200, json, uuid);

            poller.send({ test: 'something' });

            expect(requests.length).toBe(3);
            expect(requests[2].url).toContain("123-123");
            expect(requests[2].method).toEqual("POST");
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
