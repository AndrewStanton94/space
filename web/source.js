// Open a websocket
const publishSocket = new WebSocket(`wss://${window.location.host}/ws/messagereceive`);
const listenSocket = new WebSocket(`wss://${window.location.host}/ws/messagepublish`);
const haikuButtons = document.getElementById('haikuButtons');
const choiceSelectors = document.getElementById('objectUIbodyLeft');
let data;

choiceSelectors.addEventListener('input', (e) => {
	console.log(e);
	let selectedClass = e.target.getAttribute('data-selectedText');
	let {act, scene} = data.progress;

	data.progress.selectedClasses[act][scene] = selectedClass;
	console.log(data);
	publishSocket.send(JSON.stringify(data));
});

haikuButtons.addEventListener('click', (e) => {
	let selectedButton = e.target;
	console.log(selectedButton);
	let newScene = parseInt(selectedButton.getAttribute('data-selectedScene'));
	data.progress.scene = newScene;
	console.log(data);
	publishSocket.send(JSON.stringify(data));
});

listenSocket.onclose = function() {
	$("#messages").append("<div class='msg server'>Disconnected from server.</div>");
};

listenSocket.onopen = function() {
	$("#messages").append("<div class='msg server'>Connected to server.</div>");
	publishSocket.send(JSON.stringify({'start': true}));
};

listenSocket.onmessage = function(event) {
	let generateHaikuButtons = ({progress:{act, scene: currentScene}, gameDescription:{acts}}) => {
		let actInfo = acts[act];
		console.log(act, currentScene, actInfo);
		// Display scene selectors for the current act
		haikuButtons.innerHTML = "";
		actInfo.scenes.forEach((scene, i) => {
			console.log(scene);
			haikuButtons.appendChild(crel('input', {
				'type': 'button',
				'value': `Haiku ${i + 1}`,
				'data-selectedScene': i
			}));
		});
	};
	
	let generateClassSelectors = ({progress:{act, scene: currentScene, imgClasses}}) => {
		console.log(act, currentScene, imgClasses);
		imgClasses = imgClasses[act][currentScene];
		if (!imgClasses){
		    return;
		}
		console.log(imgClasses);
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
	};

	data = JSON.parse(event.data);
	console.log(data);
	
	generateHaikuButtons(data);
	generateClassSelectors(data);

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
