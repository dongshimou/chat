var express = require('express');
var urllib = require('url');
var io = require('socket.io');

var app = express();
var online = 0;
var users = {};
var hash={};
app.get('/socket.io/', function(req, res) {

	var ss = io.listen(server);
	ss.on('connection', function(socket) {
		console.log("a new user");
		//登录信息
		socket.on('login', function(obj) {
			if (!users.hasOwnProperty(obj.username)) {
				socket.name = obj.username;
				//注册一个用户信息
				users[obj.username] = 1;
				hash[obj.username]=socket;
				online++;
				console.log(socket.name, "is login");
				var data = {
					Users: users,
					Online: online,
					NewUser: socket.name
				};
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
				online--;
				console.log(socket.name, "is logout");
				//通知所有用户有人退出
				ss.emit('logout', socket.name);
			}
		});
		//发送消息
		socket.on('message', function(obj) {
			ss.emit('message', obj);
			console.log(obj.username + " : " + obj.message);
		});
		//发送推送
		socket.on('news', function(message) {
			ss.emit('news', message);
		});
		//发送私聊
		socket.on('private',function(obj){
			var send=hash[obj.target];
			send.emit('private',obj);
		});
	});


});

var server = app.listen(2333, function() {
	console.log("start");
});