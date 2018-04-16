// Open a websocket
const publishSocket = new WebSocket(`wss://${window.location.host}/ws/messagereceive`);
const listenSocket = new WebSocket(`wss://${window.location.host}/ws/messagepublish`);
const messages = document.getElementById('messages');
const haikuButtons = document.getElementById('haikuButtons');
const choiceSelectors = document.getElementById('objectProperties');
const state = document.getElementById('state');
let data;

// Save the most recent version of the progress and gameDescription
const cachedData = {};
const updateCache = ({gameDescription, progress}) => {
    console.log('Going to cache', gameDescription, progress);
    if (gameDescription) {
        cachedData.gameDescription = gameDescription;
    }
    if (progress) {
        cachedData.progress = progress;
    }
    console.log(cachedData);
};

// Produce buttons to select the haikus
const generateHaikuButtons = ({progress, gameDescription}) => {
    if (progress && gameDescription) {
        // Extract act and scene (renamed to currentScene)
        let {act, scene: currentScene} = progress;
        let {acts} = gameDescription;
        let actInfo = acts[act];
        console.log(act, currentScene, actInfo);
        // Display scene selectors for the current act
        haikuButtons.innerHTML = "";
        choiceSelectors.innerHTML = "";     // Erasing for start of acts
        state.innerText = `Act: ${act}`;
        actInfo.scenes.forEach((scene, i) => {
            console.log(scene);
            haikuButtons.appendChild(crel('input', {
                'type': 'button',
                'value': `Haiku ${i + 1}`,
                'data-selectedScene': i
            }));
        });
    }
};

// Produce selectors for the image classes from Watson
const generateClassSelectors = ({progress}) => {
    // Each Image class gets a labeled radio box
    let generateImageClassSelector = ({'class': className}) => {
        let choice = crel('div', {'class':'imgClass'},
            crel('label', className),
            crel('input', {
                'type': 'radio',
                'name': 'imgClassOption',
                'data-selectedText': className,
            })
        );
        sceneContainer.appendChild(choice);
    };

    let processScene = (sceneClasses, i) => {
        console.log('sceneClasses', sceneClasses, i);
        if (sceneClasses === null) {
            return;
        }
        let sceneContainer = crel('section', {'class': 'sceneContainer'});
        choiceSelectors.appendChild(sceneContainer);

        // Get the 3 most likely Image classes
        sceneClasses.sort((a, b) => b.score - a.score);
        sceneClasses = sceneClasses.slice(0,3);
        sceneClasses.forEach(generateImageClassSelector);
    };

    if (progress){
        let {act, imgClasses} = progress;
        let scenesInAct = imgClasses[act];
        console.log(act, scenesInAct);
        if (!scenesInAct){
            return;
        }
        choiceSelectors.innerHTML = '';
        scenesInAct.forEach(processScene);
    }
};

const drawMessage = ({message, from = '', sentiment = ''}, additionalClass = '') => {
    if (sentiment && sentiment.score) {
        if (sentiment.score === 0){
            sentiment = 'sentimentNetutral';
        }
        if (sentiment.score < 0){
            sentiment = 'sentimentNegative';
        }
        if (sentiment.score > 0){
            sentiment = 'sentimentPositive';
        }
    }

    let newMessage = crel('div', {
        'class': `msg ${sentiment} ${additionalClass}`
    });
    newMessage.innerText = `${from}: ${message}`;
    messages.appendChild(newMessage);
    //$("#messages").append("<div class='msg sentiment" + data.sentiment.score + "' >" + data.user + " - " + data.textOut + "</div>");
    if ($("#messages").children().length > 10) {
        $("#messages :first-child").remove();
    }
}

// Image class selected
choiceSelectors.addEventListener('change', (e) => {
	console.log(e);
	let selectedClass = e.target.getAttribute('data-selectedText');
	let {act, scene} = data.progress;

	data.progress.selectedClasses[act][scene] = selectedClass;
    drawMessage({message: `Selected Property: ${selectedClass}`, from: 'Properties'}, 'server');
    updateCache(data);
	publishSocket.send(JSON.stringify(data));
});

// Haiku selected
haikuButtons.addEventListener('click', (e) => {
	let selectedButton = e.target;
	console.log(selectedButton);
	let newScene = parseInt(selectedButton.getAttribute('data-selectedScene'));
	data.progress.scene = newScene;
    data.stateChanged = true;
    drawMessage({message: `Selected scene: ${newScene + 1}`, from: 'Haiku'}, 'server');
    updateCache(data);
	publishSocket.send(JSON.stringify(data));
    choiceSelectors.innerHTML = "";
    generateClassSelectors(data);
});

listenSocket.onclose = function() {
    drawMessage({message: 'Disconnected from server.', from: 'Server'}, 'server');
};

listenSocket.onopen = function() {
    drawMessage({message: 'Connected to server.', from: 'Server'}, 'server');
	publishSocket.send(JSON.stringify({'start': true}));
};

listenSocket.onmessage = function(event) {
	data = JSON.parse(event.data);
    updateCache(data);
	console.log(data);

    generateHaikuButtons(data);

    if (data.imgClasses) {
        data.progress = data.progress || cachedData.progress || console.error('No progress object');
        data.gameDescription = data.gameDescription || cachedData.gameDescription || console.error('No gameDescription object');
        let {act, scene: currentScene, imgClasses} = data.progress;
        imgClasses[act][currentScene] = data.imgClasses;
        data.progress.imgClasses = imgClasses;
        generateClassSelectors(data);
    }

	// Rescuee message received
	if (data.transcription) {
        drawMessage(data.transcription);
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
        drawMessage({message: data.msg, from: data.user});
		// Blank the text input element
		textbox.value = '';
	}
};
