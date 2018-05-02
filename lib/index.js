const { METHODS } = require('http');
const { exec, match, parse } = require('matchit');

class Trouter {
	constructor(opts) {
		this.opts = opts || {};
		this.routes = {};
		this.handlers = {};
		this.all = this.add.bind(this, '*');
		METHODS.forEach(str => {
			this[str.toLowerCase()] = this.add.bind(this, str);
		});
	}

	add(method, pattern, handler) {
		// Save decoded pattern info
		if (this.routes[method] === void 0) this.routes[method]=[];
		this.routes[method].push(parse(pattern));
		// Save route handler
		if (this.handlers[method] === void 0) this.handlers[method]={};
		this.handlers[method][pattern] = handler;
		// Allow chainable
		return this;
	}

	find(method, url) {
		let i=0, k, arr, keys=[method, '*'];
		for (; i < keys.length; i++) {
			k=keys[i]; arr=this.routes[k];
			if (arr === void 0) continue;
			arr = match(url, arr);
			if (!arr.length) continue;
			return {
				params: exec(url, arr),
				handler: this.handlers[k][arr[0].old]
			};
		}
		return false;
	}
}

module.exports = Trouter;
