var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var event = require("events")
var ObjectSocket = (function (_super) {
    __extends(ObjectSocket, _super);
    function ObjectSocket(socket) {
        _super.call(this);
        this._bufferEnd = 0;
        this._bufferOffset = 0;
        this._lastLen = 0;
        this._buffer = new Buffer(1024);
        this._open = true;
        this._socket = socket;
        var This = this;
        this._socket.on("connect", function () {
            This._open = true;
        });
        this._socket.on("data", function (data) {
            This.readBuffer(data);
            This.decodeBuffer();
        });
        this._socket.on("end", function (data) {
            This.emit("end");
        });
        this._socket.on("close", function () {
            This._open = false;
        });
    }
    ObjectSocket.prototype.sendObject = function (obj) {
        if(!this._open) {
            return;
        }
        var str = JSON.stringify(obj);
        var len = Buffer.byteLength(str, "utf8");
        var b = new Buffer(4 + len);
        b.writeInt32BE(len, 0);
        b.write(str, 4);
        this._socket.write(b);
    };
    ObjectSocket.prototype.readBuffer = function (data) {
        var needLength = data.length + this._bufferEnd;
        if(needLength > this._buffer.length) {
            var newLength = this._buffer.length;
            while(needLength > newLength) {
                newLength *= 2;
            }
            if(newLength >= (8 * 1024)) {
                throw new Error("buffer must less than 8k");
            } else {
                var tmpbuffer = new Buffer(newLength);
                this._buffer.copy(tmpbuffer, 0, this._bufferOffset, this._bufferEnd);
                this._buffer = tmpbuffer;
                this._bufferEnd = this._bufferEnd - this._bufferOffset;
                this._bufferOffset = 0;
                console.log("new buffer", this._buffer.length, this._bufferOffset, this._bufferEnd);
            }
        }
        data.copy(this._buffer, this._bufferEnd);
        this._bufferEnd += data.length;
    };
    ObjectSocket.prototype.decodeBuffer = function () {
        var tryAgain = false;
        do {
            if(this._lastLen == 0) {
                if((this._bufferEnd - this._bufferOffset) >= 4) {
                    var len = this._buffer.readUInt32BE(this._bufferOffset);
                    if(len <= 0) {
                        throw new Error("package length error");
                    }
                    this._bufferOffset += 4;
                    if((this._bufferEnd - this._bufferOffset) >= len) {
                        var packageData = new Buffer(len);
                        this._buffer.copy(packageData, 0, this._bufferOffset, this._bufferEnd);
                        this.getPackage(packageData);
                        this._lastLen = 0;
                        this._bufferOffset += len;
                        tryAgain = true;
                    } else {
                        this._lastLen = len;
                        tryAgain = false;
                    }
                } else {
                    if((this._bufferEnd - this._bufferOffset) == 0) {
                        this._buffer = new Buffer(1024);
                        this._bufferOffset = this._bufferEnd = 0;
                        tryAgain = false;
                    } else if((this._bufferEnd - this._bufferOffset) < 0) {
                        throw new Error("not possible");
                    }
                }
            } else {
                if(this._bufferEnd - this._bufferOffset >= this._lastLen) {
                    var packageData = new Buffer(this._lastLen);
                    this._buffer.copy(packageData, 0, this._bufferOffset, this._bufferEnd);
                    this.getPackage(packageData);
                    this._bufferOffset += this._lastLen;
                    tryAgain = true;
                } else {
                    tryAgain = false;
                }
            }
        }while(tryAgain);
    };
    ObjectSocket.prototype.getPackage = function (data) {
        this.emit("data", JSON.parse(data.toString()));
    };
    return ObjectSocket;
})(event.EventEmitter);
exports.ObjectSocket = ObjectSocket;
