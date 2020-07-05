const socket = io();

const $locBtn = document.querySelector('#locationBtn');
const $form = document.querySelector('#message-form');
const $msg = $form.querySelector('input');
const $formBtn = $form.querySelector('button');
const $msgs = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const msgTemplate = document.querySelector('#message-template').innerHTML;
const locTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
	//New message element
	const $newMsg = $msgs.lastElementChild;

	// Get height of new msg
	const newMsgStyles = getComputedStyle($newMsg);
	const newMsgMargin = parseInt(newMsgStyles.marginBottom);
	const newMsgHeight = $newMsg.offsetHeight + newMsgMargin;
	// Visible Height
	const visibleHeight = $msgs.offsetHeight;

	// Height of msgs container
	const containerHeight = $msgs.scrollHeight;

	// How far scrolled
	const scrollOffset = ($msgs.scrollTop + visibleHeight)*2;


	if (containerHeight - newMsgHeight <= scrollOffset) {
		$msgs.scrollTop = $msgs.scrollHeight;
	}
}	

socket.on('postMsg', (msg) => {
	const html = Mustache.render(msgTemplate, {
		username: msg.username,
		msg: msg.text,
		createdAt: moment(msg.createdAt).format('h:mm a')
	});
	$msgs.insertAdjacentHTML('beforeend', html);
	autoScroll();
});

socket.on('locationMessage', ({ username, url, createdAt }) => {
	const html = Mustache.render(locTemplate, {
		username,
		url,
		createdAt: moment(createdAt).format('h:mm a')
	})
	$msgs.insertAdjacentHTML('beforeend', html);
	autoScroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});

	$sidebar.innerHTML = html;

});

$form.addEventListener('submit', (e) => {
	e.preventDefault();

	$formBtn.setAttribute('disabled', 'disabled');

	socket.emit('message', $msg.value, (error) => {
		$formBtn.removeAttribute('disabled', 'disabled');
		$msg.value = '';
		$msg.focus();

		if (error) {
			return console.log(error);
		}
		console.log('Message Delivered!');
	});
});

$locBtn.addEventListener('click', () => {

	if(!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser.');
	}

	$locBtn.setAttribute('disabled', 'disabled');

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit('sendLocation', { lat: position.coords.latitude, long: position.coords.longitude }, (cb) => {
			$locBtn.removeAttribute('disabled', 'disabled');
			console.log(cb);
		});
	});
});

socket.emit('join', { username, room }, (err) => {
	if (err) {
		alert(err);
		location.href='/';
	}
});