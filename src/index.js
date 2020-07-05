const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMsg, generateLocationMsg }= require('./utils/messages.js');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const pubDir = path.join(__dirname, '../public');

app.use(express.static(pubDir));

io.on('connection', (socket) => {
	console.log('New websocket connection');

	socket.on('join', (options, cb) => {
		const { error, user } = addUser({ id: socket.id, ...options });

		if (error) {
			return cb(error);
		}

		socket.join(user.room);
		socket.emit('postMsg', generateMsg('Admin', `Welcome!`));
		socket.broadcast.to(user.room).emit('postMsg', generateMsg('Admin', `${user.username} has joined the room!`));
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		});


		cb();
	});

	socket.on('sendLocation', (data, cb) => {
		const user = getUser(socket.id);
		io.to(user.room).emit('locationMessage', generateLocationMsg(user.username, `https://google.com/maps?q=${data.lat},${data.long}`));
		cb('Location Shared!');
	});

	socket.on('message', (msg, cb) => {
		const filter = new Filter();
		if (filter.isProfane(msg)) {
			return cb('Profanity is not allowed!');
		}

		const user = getUser(socket.id);
		io.to(user.room).emit('postMsg', generateMsg(user.username, msg));
		cb();
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit('postMsg', generateMsg('Admin', `${user.username} has left the room!`));
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			});
		}	
	});
});


server.listen(port, () => {
	console.log(`Server is up on port ${port}`);
});