const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const settings = require('./settings.json');

function createWindow() {
	const win = new BrowserWindow({
		width: settings.width,
		height: settings.height,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			zoomFactor: 1.0
		}
	});
	win.loadFile('index.html');
	win.on('close', () => {
		const sizes = win.getSize();
		settings.width = sizes[0];
		settings.height = sizes[1];
		fs.writeFileSync('./settings.json', JSON.stringify(settings));
	});
}

app.whenReady().then(() => {
	createWindow();
});

app.on('window-all-closed', function () {
	app.quit();
})