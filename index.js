const parse = require('regexparam');

class Trouter {
	constructor() {
		this.routes = [];

		this.all = this.add.bind(this, '');
		this.get = this.add.bind(this, 'GET');
		this.head = this.add.bind(this, 'HEAD');
		this.patch = this.add.bind(this, 'PATCH');
		this.options = this.add.bind(this, 'OPTIONS');
		this.connect = this.add.bind(this, 'CONNECT');
		this.delete = this.add.bind(this, 'DELETE');
		this.trace = this.add.bind(this, 'TRACE');
		this.post = this.add.bind(this, 'POST');
		this.put = this.add.bind(this, 'PUT');
	}

	add(method, route, ...handlers) {
		let { keys, pattern } = parse(route);
		let path = '/' + route.match(/^\/?(.*?)\/?(:|\*|$)/)[1];
		this.routes.push({ keys, pattern, path, method, handlers });
		return this;
	}

	find(method, url) {
		let isALL, isHEAD=(method === 'HEAD');
		let i=0, j=0, tmp, arr=this.routes;
		let matches=[], params={}, handlers=[];
		for (; i < arr.length; i++) {
			tmp = arr[i];
			isALL = tmp.method.length === 0 && url.indexOf(tmp.path) === 0;
			if (isALL || tmp.method === method || isHEAD && tmp.method === 'GET') {
				if (tmp.keys.length > 0) {
					matches = tmp.pattern.exec(url);
					if (matches === null && !isALL) continue;
					if (matches !== null) for (j=0; j < tmp.keys.length;) params[tmp.keys[j]]=matches[++j];
					tmp.handlers.length > 1 ? (handlers=handlers.concat(tmp.handlers)) : handlers.push(tmp.handlers[0]);
				} else if (isALL || tmp.pattern.test(url)) {
					tmp.handlers.length > 1 ? (handlers=handlers.concat(tmp.handlers)) : handlers.push(tmp.handlers[0]);
				}
			} // else not a match
		}

		return { params, handlers };
	}
}

module.exports = Trouter;
