/**
 * @author nshen.net
 * @date 2013/5/31 15:47
 */

package  
{
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.ProgressEvent;
	import flash.net.Socket;
	import flash.utils.ByteArray;
	import flash.utils.Endian;
	import flash.utils.setInterval;
	
	public class Main extends Sprite
	{
		
 
		private var _socket:ObjectSocket ;
		public function Main() 
		{
			 _socket = new ObjectSocket(onData); //ObjectSocket是Socket的子类
			 _socket.addEventListener(Event.CONNECT,onConnect);//侦听连接事件 
			 _socket.addEventListener(Event.CLOSE, onClose);
             _socket.connect('127.0.0.1',2345);//连接服务端 
		}
		
		
		//收到服务器传来的object会回调到这里
		private function onData(obj:Object):void 
		{
			 trace("receive object: ",obj.num, obj.name, obj.b , obj.arr);
		}
		
		private function onClose(e:Event):void 
		{
			trace("onClose")
		}
		
		private static var sendnum:uint = 0;
		private function onConnect(e:Event):void 
		{
			trace('连接成功'); 
			
			//开始以每隔5毫秒的速度疯狂向服务器发送Object
			setInterval(function():void { 
				var obj:Object = {
					num: sendnum++,
					name: ("client" + Math.random().toString()),
					b: Math.random() > 0.5,
					arr: [ 1, 2, 3, "d", "e", "f"]
				 }
				 
				_socket.sendObject(obj); //向服务器发送obj
			 
			} , 3);
		
		}
		
	}

}