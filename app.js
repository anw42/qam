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
		welcome      : document.getElementById('welcome')
	};	

	ui.loginButton.addEventListener('click', event => loginClicked(event));
	ui.scanButton.addEventListener('click', () => {manageCam(true);});	
	ui.stopButton.addEventListener('click', () => {manageCam(false);});
	ui.switchButton.addEventListener('click', () => {manageCam(false);});
	ui.logoutButton.addEventListener('click', () => {window.location.reload(false);});
	
	const handleUI = (state) => {
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
			default:
				return false;
		}
	};

	var selCam;

	let baseUrl = '';
	let options = {};
	
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
	
	const loginClicked = (event) => {
		event.preventDefault();
		getLoginData();
		tryLogin();
	}
	
	const tryLogin = () => {
		handleUI('login-loading');
		
		fetch(baseUrl + '/version', options)
			.then(res => {
				loginButton.classList.remove('loading');
			
				if (res.status === 200) {
					//console.log('success');
					return res.json();
				}
				else if (res.status === 401) {
					errorBox.style.display="block";
					errorMessage.textContent = 'Invalid username or password. (401)';
				}
				else if (res.status === 404) {
					errorBox.style.display="block";
					errorMessage.textContent = 'Could not connect to the TOPdesk server. (404)';
				}
				else {
					errorBox.style.display="block";
					errorMessage.textContent = 'Login failed.';
				}
			})
			.then(res => {
				if (res) {
					console.log('Login successful. API version: ' + res.version);
					handleUI('logged-in');
				}
				else {
					console.log('Login failed!!!');
				}
			})
    			.catch(error => {
				errorBox.style.display="block";
				errorMessage.textContent = 'Could not connect to the TOPdesk server. (err_name_not_resolved)';
				loginButton.classList.remove('loading');
				console.log('Login failed.');
			})
	}

	const getAsset = (content) => {
		stopCam(selCam);
		welcome.style.display="none";
		
		fetch(url + '/assetmgmt/assets/' + content, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': auth
			}
		})
			.then(res => {
				document.getElementById('loading-asset').style.display="none";
			
				if (res.status === 200) {
					//console.log('success');
					return res.json();
				}
				else if (res.status === 401) {
					errorBox.style.display="block";
					errorMessage.textContent = 'Unauthorized. (401)';
				}
				else if (res.status === 404) {
					errorBox.style.display="block";
					errorMessage.innerHTML = "The QR scan was successful, however the below data is not a valid asset unid:<br><br><br>" + content;
				}
				else {
					errorBox.style.display="block";
					errorMessage.textContent = 'Other error.';
				}
			})
			.then(res => {
				if (res) {
					console.log(res);
					document.getElementById('asset-data').style.display="block";
					document.getElementById("asset-unid").value = res.data.unid;
					document.getElementById("asset-id").value = res.data.name;
					document.getElementById("specification").value = res.data.specification;
				}
				else {
					console.log('Getting the asset info failed.');
				}
			})
    			.catch(error => {
				errorBox.style.display="block";
				errorMessage.textContent = 'Could not connect to the TOPdesk server.';
				document.getElementById('loading-asset').style.display="none";
				console.log('Getting the asset info failed.');
			})
	}
	
	function startCam() {

		scanButton.style.display="none";
		welcome.style.display="none";
		stopButton.style.display="inline-flex";
		cameraFrame.style.display="block";
		errorBox.style.display="none";
		document.getElementById('asset-data').style.display="none";
		
		var scanner = new Instascan.Scanner({ video: document.getElementById('preview'), mirror: false });
		scanner.addListener('scan', content => {
			cameraFrame.style.display="none";
			console.log(content);
			getAsset(content);
			document.getElementById('loading-asset').style.display="block";
		});
			
		Instascan.Camera.getCameras()
		.then( cameras => {
	
			if (cameras.length > 0) {
				scanner.start(cameras[cameras.length-1]);
			}
			if (cameras.length > 1) {
				switchButton.style.display="inline-flex";
			}
			}).catch( e => {
				console.error(e);
				errorBox.style.display="block";
				errorMessage.textContent = 'Cannot access video stream. (Camera inaccessible)';
				stopButton.style.display="none";
				scanButton.style.display="inline-flex";
			});

		return scanner;
	}
		
	function stopCam(scanner) {

		switchButton.style.display="none";
		stopButton.style.display="none";
		scanButton.style.display="inline-flex";
		welcome.style.display="block";

		Instascan.Camera.getCameras()
		.then(cameras => {scanner.stop(cameras[cameras.length-1])
		.then(console.log('Camera stopped.'));
		})
		.catch(error => {
			errorBox.style.display="block";
			errorMessage.textContent = error;
		})
	}
	
	function manageCam(mode) {
	
		if (mode) {
			selCam = startCam();
		}
		else {
			stopCam(selCam);
		}
	
	}
