var express = require('express');
var urllib = require('url');
var io = require('socket.io');

var app = express();
//用户数量
var online = 0;
//用户名是否存在
var users = {};
//用户socket
var hash = {};
//单独房间
var rooms = {};
app.get('/socket.io/', function(req, res) {

	var ss = io.listen(server);
	var welcome = "welcome to skadi's chat room !";
	var hall = "skadi";
	ss.on('connection', function(socket) {
		console.log("a new user");
		//欢迎消息
		socket.emit('news', welcome);
		//登录信息
		socket.on('login', function(obj) {
			if (!users.hasOwnProperty(obj.username)) {
				socket.name = obj.username;
				//注册一个用户信息
				users[obj.username] = 1;
				hash[obj.username] = socket;
				rooms[obj.username] = hall;
				online++;
				console.log(socket.name, "is login");
				var data = {
					Users: users,
					Online: online,
					NewUser: socket.name
				};
				socket.join(hall);
				//发送所有在线用户信息
				ss.emit('login', data);
			} else {
				//单独发送给用户
				//重复名字拒绝登录
				socket.emit('reject', "name is exist!");
			}
		});
		//退出信息
		socket.on('disconnect', function() {
			if (socket.name == null) {
				console.log("unsign user logout!");
			} else {
				//删除退出用户信息
				delete users[socket.name];
				delete hash[socket.name];
				delete rooms[socket.name];
				online--;
				console.log(socket.name, "is logout");
				//通知所有用户有人退出
				ss.emit('logout', socket.name);
			}
		});
		//发送消息
		socket.on('message', function(obj) {
			if (rooms.hasOwnProperty(obj.username)) {
				var room = rooms[obj.username];
				socket.to(room).emit('message', obj);
			} else {
				ss.emit('message', obj);
			}
			console.log(obj.username + " : " + obj.message);
		});
		//发送推送
		socket.on('news', function(message) {
			ss.emit('news', message);
		});
		//发送私聊
		socket.on('private', function(obj) {
			var send = hash[obj.target];
			send.emit('private', obj);
		});
		//邀请加入房间
		socket.on('invite', function(obj) {
			var target = hash[obj.target];
			var origin = hash[obj.origin];
			if (target == null) {
				origin.emit('news', "invite user is not exist!");
				return;
			}
			if (rooms[obj.origin] != hall) {
				origin.emit('news', "you are in a private chat room!");
				return;
			}
			if (rooms[obj.target] != hall) {
				origin.emit('news', "invite user is in a private chat room!");
				return;
			}
			var data = {
				origin: obj.origin,
				target: obj.target,
				room: origin.id
			};
			target.emit('join', data);
			origin.emit('join', data);
		});
		//加入房间
		socket.on('join', function(obj) {
			var room = obj.room;
			socket.leave(hall);
			socket.join(room);
			rooms[socket.name] = room;
			socket.to(room).emit("news", socket.name + " join room");
		});
		//离开房间
		socket.on('leave', function() {
			var room = rooms[socket.name];
			if (room == hall) return;
			socket.to(room).emit("news", socket.name + "leave room");
			socket.leave(room);
			socket.join(hall);
			rooms[socket.name] = hall;
		});
	});
});

var server = app.listen(2333, function() {
	console.log("start");
});