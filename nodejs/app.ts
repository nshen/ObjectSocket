/// <reference path="./d/node/node.d.ts" />

import net = module("net");
import n = module("./ObjectSocket");

var objSocket: n.ObjectSocket;

var server: net.Server = net.createServer(function (socket: net.NodeSocket): void {

    console.log("connect");

    objSocket = new n.ObjectSocket(socket);

    objSocket.on("data", function (obj:any) { //客户端传来了Object
        console.log("receive object: ",obj.num, obj.name, obj.b , obj.arr);
    })

    objSocket.on("end", function () {
        console.log("on end")
    })

    //开始以每隔5毫秒的速度疯狂向客户端发送Object
   sendPackages(objSocket);



})



var sendnum:number = 0;
function sendPackages(socket:n.ObjectSocket): void
{
    setInterval(function () {
        var obj: any = {
            num: sendnum++,
            name: ("server" + Math.random().toString()),
            b: Math.random() > 0.5,
            arr: [<any> 1, 2, 3, "d", "e", "f"]
        }
        socket.sendObject(obj); //向客户端发送obj
    }, 5);
}

server.listen(2345, "localhost");