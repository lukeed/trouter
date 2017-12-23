const { exec, match, parse } = require('matchit');

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

class Trouter {
	constructor(opts) {
		this.opts = opts || {};
		this.routes = {};
		this.handlers = {};
		METHODS.forEach(str => {
			this[str.toLowerCase()] = this.add.bind(this, str);
			this.handlers[str] = {};
			this.routes[str] = [];
		});
	}

	add(method, pattern, handler) {
		// Save decoded pattern info
		this.routes[method].push(parse(pattern));
		// Save route handler
		this.handlers[method][pattern] = handler;
		// Allow chainable
		return this;
	}

	find(method, url) {
		let arr = match(url, this.routes[method]);
		if (!arr.length) return false;
		return {
			params: exec(url, arr),
			handler: this.handlers[method][arr[0].old]
		};
	}
}

module.exports = Trouter;
