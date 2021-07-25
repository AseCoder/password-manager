const fs = require('fs');
const os = require('os');
const { webFrame } = require('electron');
webFrame.setZoomFactor(1);

const accounts = require('./accounts.json');

let activeAccountId;

// defines how small a change has to be to trigger a save
// if changed, needs reload
const saveImportance = 1
// 0: save only when have to
// 1: save when a major change is done
// 2: save when anything changes

// function for showing the "saving" thing for a second
let saveIconTimeout;
const showSavingIcon = () => {
	document.getElementById('saving').classList.remove('active');
	if (saveIconTimeout) clearTimeout(saveIconTimeout);
	saveIconTimeout = setTimeout(() => {
		document.getElementById('saving').classList.add('active');
	}, 1500);
};

// function for saving
const forceSave = () => {
	showSavingIcon();
	fs.writeFileSync('./accounts.json', JSON.stringify(accounts));
};

// manager for modifying a specific accounts credentials
class credentialsManager {
	constructor(credentials = [], accountId) {
		this._credentials = credentials;
		this.accountId = accountId;
	}
	get(credentialId) {
		return accounts[this.getAccountIndex()].credentials.find(x => x.i === credentialId);
	}
	set(id, newContent = {}) {
		const { title = '', value = '' } = newContent;
		const oldContent = this.get(id);
		const index = this.getIndex(id);
		const data = {
			i: id,
			title: title || oldContent?.title || '',
			value: value || oldContent?.value || ''
		};
		if (index >= 0) accounts[this.getAccountIndex()].credentials[index] = data;
		else accounts[this.getAccountIndex()].credentials.push(data);
		if (saveImportance > 0) forceSave();
	}
	delete(id) {
		accounts[this.getAccountIndex()].credentials.splice(this.getIndex(id), 1);
		if (saveImportance > 0) forceSave();
		return;
	}
	has(credentialId) {
		return !!accounts[this.getAccountIndex()].credentials.find(x => x.i === credentialId);
	}
	getIndex(credentialId) {
		return accounts[this.getAccountIndex()].credentials.findIndex(x => x.i === credentialId);
	}
	create() {
		// function adds an empty credential to account and returns the id
		const credentialId = Math.max(...accounts[this.getAccountIndex()].credentials.map(x => x.i), -1) + 1;
		this.set(credentialId);
		return credentialId;
	}
	getAccountIndex() {
		return accounts.findIndex(x => x.id === this.accountId);
	}
}

// manager for modifying a specific account
class accountManager {
	constructor(account = {}) {
		this.accountId = account.id;
		this.credentials = new credentialsManager(account.credentials, account.id);
	}
	getAccountIndex() {
		return accounts.findIndex(x => x.id === this.accountId);
	}
	getAccount() {
		return accounts[this.getAccountIndex()];
	}
	setName(newName) {
		accounts[this.getAccountIndex()].name = newName || '';
		if (saveImportance > 0) forceSave();
	}
	setIcon(newIcon) {
		accounts[this.getAccountIndex()].icon = newIcon || '';
		if (saveImportance > 0) forceSave();
	}
	delete() {
		accounts.splice(this.getAccountIndex(), 1);
		displayAccountWidgets();
		if (saveImportance > 0) forceSave();
		return undefined;
	}
}

// manager for modifying accounts
const accountsManager = {
	generateAccountId() {
		const generatedId = Math.floor(Math.random() * 16777216).toString(16);
		if (accounts.find(x => x.id === generatedId)) return this.generateAccountId();
		else return generatedId;
	},
	newAccount() {
		const createdAccount = {
			name: 'Unnamed Account',
			id: this.generateAccountId(),
			icon: '',
			credentials: []
		};
		accounts.push(createdAccount);
		if (saveImportance > 0) forceSave();
		return new accountManager(createdAccount);
	},
	getAccount(accountId) {
		const account = accounts.find(x => x.id === accountId);
		return new accountManager(account);
	},
	hasAccount(accountId) {
		return !!accounts.find(x => x.id === accountId);
	}
};

// array that contains all remove buttons on widgets so they can be removed
let accountRemoveElements = [];

// function that adds a removal button to all account widgets
const addAccountRemovalButtons = () => {
	document.querySelectorAll('.accountWidgetContainer').forEach(widget => {
		const removeButtonForWidget = document.createElement('div');
		removeButtonForWidget.classList.add('removeButtonForWidget');
		removeButtonForWidget.setAttribute('onclick', `accountsManager.getAccount(\'${widget.id}\').delete()`);
		const text = document.createTextNode('✖️');
		removeButtonForWidget.appendChild(text);
		widget.appendChild(removeButtonForWidget);
		accountRemoveElements.push(removeButtonForWidget);
	});
};

// function that takes in a default value and options. returns a dom object
const createInput = (options = {}) => {
	const {
		defaultValue,
		defaultTitle,
		titlePlaceholder,
		valuePlaceholder,
		titleBool = true,
		hideable = true,
		hidden,
		removable = true,
		id
	} = options;

	// div houses 2 divs, 1 for input fields, 1 for buttons and id
	const div = document.createElement('div');
	div.classList.add('credentialDiv');

	// start with input fields
	const inputDiv = document.createElement('div');
	inputDiv.classList.add('credentialInputDiv');

	// title comes first
	if (titleBool) {
		const titleInput = document.createElement('input');
		titleInput.classList.add('credentialTitle', 'credentialInput');
		titleInput.setAttribute('placeholder', titlePlaceholder || 'Credential Name');
		titleInput.setAttribute('id', id + '-title')
		titleInput.onchange = e => {
			// change credential title
			const credentialId = parseInt(e.target.id.split('-')[0]);
			accountsManager.getAccount(activeAccountId).credentials.set(credentialId, { title: e.target.value });
			// reload credentials
			displayCredentials(activeAccountId);
		};
		if (defaultTitle) titleInput.value = defaultTitle;
		inputDiv.appendChild(titleInput);
	}

	// value
	const valueInput = document.createElement('input');
	valueInput.classList.add('credentialValue', 'credentialInput');

	// if no title, value can be wider
	if (!titleBool) valueInput.classList.add('credentialValueWide');

	valueInput.setAttribute('placeholder', valuePlaceholder || 'Credential Value');

	// depending on if value is supposed to be hidden
	if (hidden) valueInput.setAttribute('type', 'password');
	else valueInput.setAttribute('type', 'text');

	valueInput.setAttribute('id', id + '-value');

	if (defaultValue) valueInput.value = defaultValue;

	valueInput.onchange = e => {
		// change credential value
		const credentialId = parseInt(e.target.id.split('-')[0]);
		accountsManager.getAccount(activeAccountId).credentials.set(credentialId, { value: e.target.value });
		// reload credentials
		displayCredentials(activeAccountId);
	};

	inputDiv.appendChild(valueInput);

	// input fields done, move to buttons and id
	const buttonDiv = document.createElement('div');
	buttonDiv.classList.add('credentialButtonDiv');

	// hide button
	if (hideable) {
		const hideButton = document.createElement('button');
		hideButton.classList.add('credentialValueHideButton', 'credentialButton');
		hideButton.setAttribute('id', id + '-hide');
		hideButton.setAttribute('onclick', `toggleHide(\'${id}\')`);

		// if value is supposed to be hidden, make eye red
		if (hidden) hideButton.classList.add('active');

		// text for hide button
		const hideButtonText = document.createTextNode('👁️');
		hideButton.appendChild(hideButtonText);

		buttonDiv.appendChild(hideButton);
	}

	// remove button
	if (removable) {
		const removeButton = document.createElement('button');
		removeButton.classList.add('credentialRemoveButton', 'credentialButton');
		removeButton.setAttribute('id', id + '-remove');
		removeButton.setAttribute('onclick', `removeCredential(${id})`);

		// text for remove button
		const removeButtonText = document.createTextNode('🗑️');
		removeButton.appendChild(removeButtonText);

		buttonDiv.appendChild(removeButton);
	}

	// id
	const i = document.createElement('i');
	i.classList.add('credentialId');
	const idText = document.createTextNode('#' + id);
	i.appendChild(idText);
	buttonDiv.appendChild(i);

	// merge everything
	div.appendChild(inputDiv);
	div.appendChild(buttonDiv);

	return div;
};

// function that takes options and creates a credential field
const createCredential = (credentialData) => {
	const isPassword = ['password', 'salasana'].includes(credentialData.title.toLowerCase());
	const el = createInput({
		defaultTitle: credentialData.title,
		defaultValue: credentialData.value,
		hideable: isPassword,
		hidden: isPassword,
		id: credentialData.i,
	});
	return el;
};

// takes an account id and shows the credentials in .content
const displayCredentials = (accountId) => {
	// clear canvas to write stuff on
	const contentDiv = document.getElementById('content');
	contentDiv.innerHTML = '';

	// check that account exists
	if (!accountsManager.hasAccount(accountId)) return;

	activeAccountId = accountId;

	const account = accounts.find(x => x.id === accountId);

	// remove active from all widgets
	document.querySelectorAll('.accountWidget.active').forEach(x => x.classList.remove('active'));

	// mark widget as active
	document.getElementById(accountId).classList.add('active');

	// first div contains icon, name and #id
	const headerDiv = document.createElement('div');
	headerDiv.classList.add('contentHeader');

	// icon
	if (account.icon) {
		const iconDiv = document.createElement('div');
		iconDiv.classList.add('contentHeaderIcon');
		iconDiv.style.backgroundImage = `url(\"${account.icon}\")`;
		headerDiv.appendChild(iconDiv);
	}

	// name
	const name = createInput({
		titleBool: false,
		defaultValue: account.name,
		valuePlaceholder: 'Account Name',
		hideable: false,
		removable: false,
		id: account.id
	});
	name.onchange = e => {
		// when name input field is changed, set account name to new value
		const newValue = e.target.value;
		accountsManager.getAccount(accountId).setName(newValue);
		displayAccountWidgets();
	};
	headerDiv.appendChild(name);

	contentDiv.appendChild(headerDiv);

	// icon url input field
	const iconUrl = createInput({
		titleBool: false,
		defaultValue: account.icon,
		valuePlaceholder: 'Icon URL',
		hideable: false,
		removable: false,
		id: 'icon'
	});
	iconUrl.onchange = e => {
		// when icon url input field is changed, set account icon url to new value
		const newValue = e.target.value;
		accountsManager.getAccount(accountId).setIcon(newValue);
		displayAccountWidgets();
	};
	contentDiv.appendChild(iconUrl);

	// "credentials:" text
	const h2 = document.createElement('p');
	h2.classList.add('credentialH2');
	const h2text = document.createTextNode('Credentials:');
	h2.appendChild(h2text);

	contentDiv.appendChild(h2);

	// credentials
	account.credentials.sort((a, b) => a.i - b.i).forEach(credential => {
		const el = createCredential(credential);
		contentDiv.appendChild(el);
	});

	// new credential button
	const newCredentialButton = document.createElement('button');
	newCredentialButton.classList.add('newCredentialButton');
	const newCredentialButtonText = document.createTextNode('Add');
	newCredentialButton.appendChild(newCredentialButtonText);
	newCredentialButton.onclick = () => {
		// add credential to account and reload credentials
		accountsManager.getAccount(accountId).credentials.create();
		displayCredentials(accountId);
	};
	contentDiv.appendChild(newCredentialButton);
};

// function for displaying an account widget (in sidebar) from an account object
const displayAccountWidget = (account) => {
	// create div that houses flex div and possible removal button
	const containerDiv = document.createElement('div');
	containerDiv.classList.add('accountWidgetContainer');
	containerDiv.setAttribute('id', account.id);
	containerDiv.setAttribute('onclick', `displayCredentials(\'${account.id}\')`)

	// create div that houses icon and name
	const mainDiv = document.createElement('div');
	mainDiv.classList.add('accountWidget');

	// assign click event to maindiv, which shows the account and its credentials

	// create div that has icon background
	if (account.icon) {
		const iconDiv = document.createElement('div');
		iconDiv.classList.add('accountWidgetIcon');
		iconDiv.style.backgroundImage = `url(\'${account.icon}\')`;
		mainDiv.appendChild(iconDiv);
	}

	// create div that has name
	// div will have display flex so text inside can be centered vertically
	const nameDiv = document.createElement('div');
	nameDiv.classList.add('accountWidgetNameDiv');

	// name div will have text inside
	const nameP = document.createElement('p');
	nameP.classList.add('accountWidgetName');

	// create text node
	const name = document.createTextNode(account.name);

	// merge text to p
	nameP.appendChild(name);

	// merge p to namediv
	nameDiv.appendChild(nameP);

	// merge text div and parent div
	mainDiv.appendChild(nameDiv);

	// merge main div to container
	containerDiv.appendChild(mainDiv);

	// add maindiv to site
	const accountListDiv = document.getElementById('accountList');
	accountListDiv.appendChild(containerDiv);
};

// display account widgets in sidebar
const displayAccountWidgets = () => {
	const accountListDiv = document.getElementById('accountList');

	// clear the place where these go
	accountListDiv.innerHTML = '';

	// find a filter
	const filter = document.getElementById('search').value.toLowerCase();

	// if filter exists, run it. else variable contains all accounts
	const filteredAccounts = filter ? accounts.filter(x => x.name.toLowerCase().includes(filter)) : accounts;

	// display filtered accounts one by one in sidebar
	filteredAccounts.sort((a, b) => a.name.localeCompare(b.name)).forEach(account => {
		displayAccountWidget(account);
	});

	// to the bottom, add a text that says how many accounts are shown, and the total amount if a filter is defined
	// textdiv centers p
	const textDiv = document.createElement('div');

	// p contains text
	const p = document.createElement('p');
	p.style.fontSize = '13px';
	p.style.color = 'rgba(255, 255, 255, .7)';

	// text
	const text = document.createTextNode((() => {
		if (filter) return `Showing ${filteredAccounts.length} of ${accounts.length} accounts.`;
		else return `Showing ${accounts.length} accounts.`;
	})());

	// merge
	p.appendChild(text);
	textDiv.appendChild(p);
	accountListDiv.appendChild(textDiv);

	// add removal buttons if necessary
	if (document.getElementById('removeAccountButton').innerText === 'Cancel') addAccountRemovalButtons();
};

// init page
displayAccountWidgets();

// when user clicks on spyglass, focus on the search field
const focusSearch = () => {
	document.getElementById('search').focus();
}

// function that runs when the eye is clicked. it toggles "password" type of the value
const toggleHide = (elementId) => {
	const el = document.getElementById(elementId + '-value');
	if (el.type === 'text') el.type = 'password';
	else el.type = 'text';
	document.getElementById(elementId + '-hide').classList.toggle('active');
}

// function that runs when the trash can is clicked. removes credential from account and updates credential display
const removeCredential = (credentialId) => {
	accountsManager.getAccount(activeAccountId).credentials.delete(credentialId);
	displayCredentials(activeAccountId);
};

// function that runs when "add" is clicked in the sidebar. creates a new blank account
const createNewAccount = () => {
	const account = accountsManager.newAccount();
	displayAccountWidgets();
	displayCredentials(account.accountId);
};

// function that is run when "remove" is clicked in the sidebar. allows user to delete an account and turns "remove" button into a red "cancel" button to cancel the removal
const activateRemoval = () => {
	const removeButton = document.getElementById('removeAccountButton');

	// if removal is currently active, turn it off
	if (removeButton.innerText === 'Cancel') {
		removeButton.classList.remove('active');
		removeButton.innerText = 'Remove';
		accountRemoveElements.forEach(x => x.remove());
		return;
	}

	// "remove" button
	removeButton.classList.add('active');
	removeButton.innerText = 'Cancel';

	// add a remove element to all account widgets
	addAccountRemovalButtons();
};

// when the page is closed, save
window.addEventListener('beforeunload', () => {
	forceSave();
});

// function that runs when search is changed. if sufficient time has passed, displays search results that match the search
let changeTimeout;
const updateSearch = () => {
	// display search results after x time. if this function is run again within x time, reset x timer
	if (changeTimeout) clearTimeout(changeTimeout);
	changeTimeout = setTimeout(() => {
		const searchValue = document.getElementById('search').value;
		// display account widgets and filter accounts whose name includes search value
		// if no search value, ie search is empty, show all accounts
		displayAccountWidgets();
	}, 200);
};

// profile
document.getElementById('username').innerText = os.userInfo().username;
const updateClock = () => {
	const oldClock = document.getElementById('clock').innerText || '';
	const now = new Date();
	const newClock = ('0' + now.getHours()).slice(-2) + (oldClock.includes(':') ? ' ' : ':') + ('0' + now.getMinutes()).slice(-2);
	document.getElementById('clock').innerText = newClock;
};
updateClock();
setInterval(() => {
	updateClock();
}, 1000);