var net = require("net")
var n = require("./ObjectSocket")
var objSocket;
var server = net.createServer(function (socket) {
    console.log("connect");
    objSocket = new n.ObjectSocket(socket);
    objSocket.on("data", function (obj) {
        console.log("receive object: ", obj.num, obj.name, obj.b, obj.arr);
    });
    objSocket.on("end", function () {
        console.log("on end");
    });
    sendPackages(objSocket);
});
var sendnum = 0;
function sendPackages(socket) {
    setInterval(function () {
        var obj = {
            num: sendnum++,
            name: ("server" + Math.random().toString()),
            b: Math.random() > 0.5,
            arr: [
                1, 
                2, 
                3, 
                "d", 
                "e", 
                "f"
            ]
        };
        socket.sendObject(obj);
    }, 5);
}
server.listen(2345, "localhost");
