/// <reference path="./d/node/node.d.ts" />
import net = module("net");
import event = module("events");

export class ObjectSocket extends event.EventEmitter{
    
    private _socket: net.NodeSocket;
    private _bufferEnd: number = 0;
    private _bufferOffset: number = 0;
    private _lastLen: number = 0;
    private _buffer: NodeBuffer = new Buffer(1024);//1k; 

    private _open: bool = true;

    constructor(socket: net.NodeSocket)
    {
        
        super();
        this._socket = socket;
       
        var This: ObjectSocket = this;
        this._socket.on("connect", function () {
            This._open = true;
        })
        this._socket.on("data", function (data: NodeBuffer) {
            This.readBuffer(data);
            This.decodeBuffer();
        })
        this._socket.on("end", function (data: NodeBuffer) {
            This.emit("end");
        })
        this._socket.on("close", function () {
            This._open = false;
        })
    }

    /**
    * 发送Object
    */
    public sendObject(obj: Object): void
    {
        if (!this._open)
            return;
        var str: string = JSON.stringify(obj);
        var len: number = Buffer.byteLength(str, "utf8");
        var b: NodeBuffer = new Buffer(4 + len);
        b.writeInt32BE(len, 0);
        b.write(str, 4);
        this._socket.write(b);
    }

    /**
    *  将每次socket传来的数据都添到_buffer尾部等待处理
    */
    private readBuffer(data: NodeBuffer): void
    {
        //-------------------------------------------------------------
        // 不同于flash端，由于_buffer是固长的，这里要自行缩放

        var needLength: number = data.length + this._bufferEnd;
        if (needLength > this._buffer.length) {
            //buffer装不下新来的数据了，创建个新的是原来的2倍长
            var newLength: number = this._buffer.length;
            while (needLength > newLength) {
                newLength *= 2;
            }
            if (newLength >= (8 * 1024)) {
                throw new Error("buffer must less than 8k");
            } else {
                var tmpbuffer: NodeBuffer = new Buffer(newLength);
                this._buffer.copy(tmpbuffer, 0, this._bufferOffset, this._bufferEnd);
                this._buffer = tmpbuffer;
                this._bufferEnd = this._bufferEnd - this._bufferOffset;
                this._bufferOffset = 0;
                console.log("new buffer", this._buffer.length, this._bufferOffset, this._bufferEnd);
            }
        }
        //-------------------------------------------------------------------------
        data.copy(this._buffer, this._bufferEnd);
        this._bufferEnd += data.length;
    }

   
    /**
    * 解析_buffer
    */
    private decodeBuffer(): void
    {
        // decode buffer
        var tryAgain: bool = false;
        do {
            if (this._lastLen == 0) //没读取包长度
            {
                if ((this._bufferEnd - this._bufferOffset) >= 4) // 有包头
                {
                    var len: number = this._buffer.readUInt32BE(this._bufferOffset);
                    if (len <= 0)
                        throw new Error("package length error");
                    this._bufferOffset += 4;
                    if ((this._bufferEnd - this._bufferOffset) >= len)//有整个包
                    {
                        var packageData: NodeBuffer = new Buffer(len);//读出整个包
                        this._buffer.copy(packageData, 0, this._bufferOffset, this._bufferEnd);                  
                        this.getPackage(packageData);
                        this._lastLen = 0;
                        this._bufferOffset += len;
                        tryAgain = true; //可能还有包
                    } else { //只有长度，包不全，等下次
                        this._lastLen = len;
                        tryAgain = false;
                    }

                } else {
                    if ((this._bufferEnd - this._bufferOffset) == 0) {
                        // clear()
                        this._buffer = new Buffer(1024);//1k
                        this._bufferOffset = this._bufferEnd = 0;
                        tryAgain = false;

                    } else if ((this._bufferEnd - this._bufferOffset) < 0) {
                        throw new Error("not possible");
                    }
                }

            } else {
                if (this._bufferEnd - this._bufferOffset >= this._lastLen) {
                    //有整个包了
                    var packageData: NodeBuffer = new Buffer(this._lastLen);//读出整个包
                    this._buffer.copy(packageData, 0, this._bufferOffset, this._bufferEnd);
                    this.getPackage(packageData);
                    this._bufferOffset += this._lastLen;
                    tryAgain = true;//有可能还有包
                } else {
                    tryAgain = false;
                }
            }

        } while (tryAgain)
    }


    private getPackage(data: NodeBuffer): void
    {
        this.emit("data", JSON.parse(data.toString()));
    }



}

