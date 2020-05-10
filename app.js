const ui = {
	loginButton  : document.getElementById('login-submit'),
	scanButton   : document.getElementById('scan'),
	stopButton   : document.getElementById('stop'),
	switchButton : document.getElementById('switch'),
	logoutButton : document.getElementById('logout'),
	loginForm    : document.getElementById('login-form'),
	errorBox     : document.getElementById('error-box'),
	errorMessage : document.getElementById('error-message'),
	cameraFrame  : document.getElementById('camera-frame'),
	welcome      : document.getElementById('welcome'),
	assetData    : document.getElementById('asset-data')
};	

ui.loginButton.addEventListener('click', e => loginClicked(e));
ui.scanButton.addEventListener('click', () => {manageCam(true);});	
ui.stopButton.addEventListener('click', () => {manageCam(false);});
ui.switchButton.addEventListener('click', () => {manageCam(false);});
ui.logoutButton.addEventListener('click', () => {window.location.reload(false);});

const handleUI = (state, errorMsg) => {
	switch(state) {
		case 'login-loading':
			ui.loginButton.classList.add('loading');
			break;
		case 'logged-in':
			ui.loginForm.style.display="none";
			ui.scanButton.style.display="inline-flex";
			ui.logoutButton.style.display="inline-flex";
			ui.cameraFrame.style.display="block";
			ui.welcome.style.display="block";
			break;
		case 'start-camera':
			ui.scanButton.style.display="none";
			ui.welcome.style.display="none";
			ui.stopButton.style.display="inline-flex";
			ui.cameraFrame.style.display="block";
			ui.errorBox.style.display="none";
			ui.assetData.style.display="none";
			break;
		case 'if-more-cams':
			ui.switchButton.style.display="inline-flex";
			break;
		case 'stop-camera':
			ui.switchButton.style.display="none";
			ui.stopButton.style.display="none";
			ui.scanButton.style.display="inline-flex";
			ui.welcome.style.display="block";
			break;
		case 'fetch-failed':
			ui.errorBox.style.display="block";
			ui.errorMessage.textContent = errorMsg;
			ui.loginButton.classList.remove('loading');
			break;
		default:
			return false;
	}
};

var selCam;

let baseUrl = '';
let options = {};
let mirror = false;

const getLoginData = () => {
	baseUrl = document.getElementById('url').value + '/tas/api';
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	const auth = 'Basic ' + btoa(username + ':' + password);

	options.method = 'GET';
	options.headers = {
		'Content-Type': 'application/json',
		'Authorization': auth
	};
		
	return true;
};
	
const loginClicked = (e) => {
	e.preventDefault();
	getLoginData();
	tryLogin();
}

const fetchError = (res) => {
	if(res.status === 401) { return handleUI('fetch-failed', 'Wrong username and password or Unauthorized (error: 401)');}
	else if(res.status === 404) { const errorMsg = 'Not found / Wrong URL (404)'; }
	else { const errorMsg = 'Login faied misc'}
};

const tryLogin = () => {
	handleUI('login-loading');

	fetch(baseUrl + '/version', options)
		.then(res => {
			if (!res.ok) { fetchError(res); }
			else { return res.json(); }
		})
		.then(res => {
			if (res) {
				console.log('Login successful. API version: ' + res.version);
				handleUI('logged-in');
			}
			else { console.log('Login failed.');}
		})
    		.catch(error => {return handleUI('fetch-failed', 'Could not connect to the server (err_name_not_resolved)');});
}
	
function startCam() {
	handleUI('start-camera');

	var scanner = new Instascan.Scanner({ video: document.getElementById('preview'), mirror: mirror });
	scanner.addListener('scan', content => {
		ui.cameraFrame.style.display="none";
		document.getElementById('loading-asset').style.display="block";
		getAssetAssignments(content);
		
	});

	Instascan.Camera.getCameras()
		.then( cameras => {	
			if (cameras.length > 0) {
				scanner.start(cameras[cameras.length-1]);
			}
			if (cameras.length > 1) {
				handleUI('if-more-cams');
			}
		})
		.catch( e => {
			console.error(e);
			ui.errorBox.style.display="block";
			ui.errorMessage.textContent = 'Cannot access video stream. (Camera inaccessible)';
			ui.stopButton.style.display="none";
			ui.scanButton.style.display="inline-flex";
		});

	return scanner;
}

function stopCam(scanner) {
	handleUI('stop-camera');

	Instascan.Camera.getCameras()
		.then(cameras => {scanner.stop(cameras[cameras.length-1])
		.then(console.log('Camera stopped.'));
		})
		.catch(error => {
			ui.errorBox.style.display="block";
			ui.errorMessage.textContent = error;
		})
}

const getAssetFields = (content) => {
	stopCam(selCam);
	welcome.style.display="none";
	
	fetch(baseUrl + '/assetmgmt/assets/' + content, options)
			.then(res => {
				document.getElementById('loading-asset').style.display="none";
		
				if (!res.ok) { fetchError(res); }
				else { return res.json(); }
			})
			.then(res => {
				if (res) {
					console.log(res);
					document.getElementById('asset-data').style.display="block";
					document.getElementById("asset-unid").value = res.data.unid;
					document.getElementById("asset-id").value = res.data.name;
					document.getElementById("specification").value = res.data.specification;
				}
			})
    		.catch(error => {return handleUI('fetch-failed', 'Could not connect to the server (err_name_not_resolved)');});
}

const getAssetAssignments = (content) => {
	stopCam(selCam);
	welcome.style.display="none";
	
	fetch(baseUrl + '/assetmgmt/assets/' + content + '/assignments', options)
			.then(res => {
				document.getElementById('loading-asset').style.display="none";
		
				if (!res.ok) { fetchError(res); }
				else { return res.json(); }
			})
			.then(res => {
				if (res) {					
					document.getElementById('asset-data').style.display="block";
					document.getElementById('asset-data').innerHTML = '<div class="ui large label"><i class="user icon"></i>' + res['persons'][0]['person']['name'] + '</div><br><br>';

					/*
					document.getElementById("asset-unid").value = res.data.unid;
					document.getElementById("asset-id").value = res.data.name;
					document.getElementById("specification").value = res.data.specification;*/
				}
			})
    		.catch(error => {return handleUI('fetch-failed', 'Could not connect to the server (err_name_not_resolved)');});
}

function manageCam(mode) {
	if (mode) { selCam = startCam(); }
	else { stopCam(selCam); }
}
