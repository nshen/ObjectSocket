/**
 * @author nshen.net
 * @date 2013/6/3 17:04
 */

package  
{
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.net.Socket;
	import flash.utils.ByteArray;
	import flash.utils.Endian;

	public class ObjectSocket extends Socket
	{
		 
		private var _open:Boolean = false;
		private var _buffer : ByteArray;
		private var _lastLen:uint = 0 ;//上次包的长度
		private var _callback:Function;
		
		/**
		 * @param	callback   function(o:Object){}
		 */
		public function ObjectSocket(callback:Function = null):void 
		{
			super();
			_buffer = new ByteArray();
			_buffer.endian = Endian.BIG_ENDIAN;
			this._callback = callback;
			this.addEventListener(Event.CONNECT, onSocketConnect);
            this.addEventListener(ProgressEvent.SOCKET_DATA, onData);
			this.addEventListener(Event.CLOSE, onSocketClose);
			this.addEventListener(IOErrorEvent.IO_ERROR, onSocketClose);
			this.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onSocketClose);
			//_socket.addEventListener(Event.CLOSE, onClose);
		}
		
		private function onSocketClose(e:Event):void 
		{
			_open = false;
		}
		
		private function onSocketConnect(e:Event):void 
		{
			_open = true;
		}
		
		public function sendObject(obj:Object):void
		{
			if (!_open)
				return;
			var str:String = JSON.stringify(obj)
			var res:ByteArray = new ByteArray();
			res.endian = Endian.BIG_ENDIAN;
			res.writeUTFBytes(str);
			var len:uint = res.length;
			res.clear();
			res.writeUnsignedInt(len);
			res.writeUTFBytes(str);
			
			this.writeBytes(res);
			this.flush();
			
		}
		
		private function onData(e:ProgressEvent):void
		{
			 readBytes(_buffer, _buffer.length, bytesAvailable);
			 decodeBuffer();
		}
		
		private function decodeBuffer():void
		{		
			var tryAgain : Boolean = false;
			do
			{
				if (_lastLen == 0)//没读包长度
				{
					if (_buffer.bytesAvailable >= 4)
					{
					   var len:uint = _buffer.readUnsignedInt();
					   if (len <= 0 )
							throw new Error("package length error");
					   if (_buffer.bytesAvailable >= len) //有整个包
					   {
						   getPackage(_buffer.readUTFBytes(len));
						   _lastLen = 0;
						   tryAgain = true; //可能还有包
					   }else { //包不全，等下次
						   _lastLen = len;
						   tryAgain = false; 
					   }
					}else
					{
						if (_buffer.bytesAvailable == 0)
							_buffer.clear();
						tryAgain = false;
					}
				}else
				{
				   if (_buffer.bytesAvailable >= _lastLen)
				   {
					   getPackage(_buffer.readUTFBytes(_lastLen));
					   _lastLen = 0;
					   tryAgain = true;
				   }else
				   {
					   tryAgain =  false
				   }
				}
				
			}while(tryAgain)
		}
		
		
		private function getPackage(str:String): void
		{
			if (_callback != null)
			{
				_callback(JSON.parse(str))
			}
		}
	}

}