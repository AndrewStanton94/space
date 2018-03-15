// Open a websocket
var publishSocket = new WebSocket("wss://{{req.headers.host}}/public/messagereceive");
var listenSocket = new WebSocket("wss://{{req.headers.host}}/public/messagepublish");

listenSocket.onmessage = function(event) {
    // When receiving a message append a div child to #messages
    data = JSON.parse(event.data);
    console.log(event);
    if (data.messageType === 0) {
        $("#messages").append("<div class='msg sentiment" + data.sentiment + "' >" + data.user + " - " + data.msg + "</div>");
        if ($("#messages").children().length > 10) {
            $("#messages :first-child").remove();
        }
    }
    if (data.messageType == 1) {
        $("#messages").append("<div class='msg server'>" + data.user + " - " + "Reading Haiku #1 to team" + "</div>");
    }
    if (data.messageType == 2) {
        $("#messages").append("<div class='msg server'>" + data.user + " - " + "Reading Haiku #2 to team" + "</div>");
    }
    if (data.messageType == 3) {
        $("#messages").append("<div class='msg server'>" + data.user + " - " + "Reading Haiku #3 to team" + "</div>");
    }
    if (data.messageType == 4) {
        $("#messages").append("<div class='msg server'>" + data.user + " - " + "Camera data received" + "</div>");
    }
};

listenSocket.onclose = function(event) {
    $("#messages").append("<div class='msg server'>Disconnected from server.</div>");
};

listenSocket.onopen = function(event) {
    $("#messages").append("<div class='msg server'>Connected to server.</div>");
};

function sendText(event) {
    // Only if return key pressed
    if (event.keyCode == 13) {
        // Construct object containing the data the server needs.
        d = new Date();
        var data = {
            msg: $("#textbox").val(),
            user: "Rescuer",
            messageType: 0,
            timestamp: d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
        };
        // Send the msg object as a JSON-formatted string.
        publishSocket.send(JSON.stringify(data));
        // Blank the text input element
        $("#textbox").val("");
    }
}

function activateHaiku1() {
    d = new Date();
    var data = {
        msg: "Moths fly late at night. Shining darker than the sky. Imperfect couple.",
        user: "System",
        messageType: 1,
        timestamp: d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
    };
    publishSocket.send(JSON.stringify(data));
    $("#textbox").val("");
}

function activateHaiku2() {
    d = new Date();
    var data = {
        msg: "Waves of the ocean. Parallel to a trio. The pebbles below.",
        user: "System",
        messageType: 2,
        timestamp: d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
    };
    publishSocket.send(JSON.stringify(data));
    $("#textbox").val("");
}

function activateHaiku3() {
    d = new Date();
    var data = {
        msg: "Red koi of a stream. Pushing against the current. Never going blunt.",
        user: "System",
        messageType: 3,
        timestamp: d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
    };
    publishSocket.send(JSON.stringify(data));
    $("#textbox").val("");
}
