// Open a websocket
const publishSocket = new WebSocket(`wss://${window.location.host}/ws/messagereceive`);
const listenSocket = new WebSocket(`wss://${window.location.host}/ws/messagepublish`);
const haikuButtons = document.getElementById('haikuButtons');
const choiceSelectors = document.getElementById('objectUIbodyLeft');

choiceSelectors.addEventListener('input', (e) => {
	console.log(e);
	let msg = {
		'state': JSON.parse(sessionStorage.getItem('state')),
		'choice': e.target.getAttribute('data-selectedText'),
	};
	console.log(msg);
	publishSocket.send(JSON.stringify(msg));
});

haikuButtons.addEventListener('click', (e) => {
	let selectedButton = e.target;
	let state = JSON.parse(sessionStorage.getItem('state'));
	console.log(selectedButton);
	let newScene = parseInt(selectedButton.getAttribute('data-selectedScene'));
	state.scene = newScene;
	publishSocket.send(JSON.stringify({'state': state}));
});

listenSocket.onclose = function() {
	$("#messages").append("<div class='msg server'>Disconnected from server.</div>");
};

listenSocket.onopen = function() {
	$("#messages").append("<div class='msg server'>Connected to server.</div>");
	publishSocket.send(JSON.stringify({'start': true}));
};

listenSocket.onmessage = function(event) {
	// When receiving a message append a div child to #messages
	let data = JSON.parse(event.data);
	console.log(data);

	// Server has sent the classes extracted from an image
	if(data.imgClasses){
		let imgClasses = data.imgClasses;

		// Get the 6 most likely Image classes
		imgClasses.sort((a, b) => b.score - a.score);
		imgClasses = imgClasses.slice(0,6);

		choiceSelectors.innerHTML = "";

		// Each Image class gets a labeled radio box
		let generateImageClassSelector = ({'class': className}) => {
			let choice = crel('div', {'class':'imgClass'},
				crel('label', className),
				crel('input', {
					'type': 'radio',
					'data-selectedText': className,
				})
			);
			choiceSelectors.appendChild(choice);
		};
		imgClasses.forEach(generateImageClassSelector);
	}

	// Save the act and scene update
	if(data.state){
		console.info('New state', data.state);
		sessionStorage.setItem('state', JSON.stringify(data.state));
	}

	// Display scene selctors for the current act
	if (data.actInfo) {
		let {actInfo} = data;
		haikuButtons.innerHTML = "";
		console.log(actInfo);
		sessionStorage.setItem('actInfo', JSON.stringify(actInfo));
		actInfo.scenes.forEach((item, i) => {
			console.log(item);
			haikuButtons.appendChild(crel('input', {
				'type': 'button',
				'value': `Haiku ${i + 1}`,
				'data-selectedScene': i
			}));
		});
	}

	// Rescuee message received
	if (data.textOut) {
		$("#messages").append("<div class='msg sentiment" + data.sentiment.score + "' >" + data.user + " - " + data.textOut + "</div>");
		if ($("#messages").children().length > 10) {
			$("#messages :first-child").remove();
		}
	}

	switch(data.messageType){
		case 0:
			$("#messages").append("<div class='msg sentiment" + data.sentiment + "' >" + data.user + " - " + data.msg + "</div>");
			if ($("#messages").children().length > 10) {
				$("#messages :first-child").remove();
			}
		break;

		case 1:
			$("#messages").append("<div class='msg server'>" + data.user + " - " + "Reading Haiku #1 to team" + "</div>");
		break;

		case 2:
			$("#messages").append("<div class='msg server'>" + data.user + " - " + "Reading Haiku #2 to team" + "</div>");
		break;

		case 3:
			$("#messages").append("<div class='msg server'>" + data.user + " - " + "Reading Haiku #3 to team" + "</div>");
		break;

		case 4:
			$("#messages").append("<div class='msg server'>" + data.user + " - " + "Camera data received" + "</div>");
		break;
	}
};

let timeStamp = () => {
	const d = new Date();
	return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
};

// Sending text, listener set in HTML
function sendText(event) {
	// Only if return key pressed
	if (event.keyCode === 13) {
		const textbox = document.getElementById('textbox');
		// Construct object containing the data the server needs.
		let data = {
			msg: textbox.value,
			user: "Rescuer",
			messageType: 0,
			timestamp: new Date()
		};
		// Send the msg object as a JSON-formatted string.
		console.log(data);
		publishSocket.send(JSON.stringify({message: data}));
		// Blank the text input element
		textbox.value = '';
	}
};
