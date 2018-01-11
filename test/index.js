const { METHODS } = require('http');
const { test, Test } = require('tape');
const Trouter = require('../lib');

const r = new Trouter();
const $ = Test.prototype;

$.isEmpty = function (val, msg) {
	this.ok(!Object.keys(val).length, msg);
}

$.isArray = function (val, msg) {
	this.ok(Array.isArray(val), msg);
}

$.isObject = function (val, msg) {
	this.ok(Boolean(val) && (val.constructor === Object), msg);
}

$.isFunction = function (val, msg) {
	this.is(typeof val, 'function', msg);
}

test('exports', t => {
	t.isFunction(Trouter, 'exports a function');
	t.end();
});

test('instance', t => {
	t.true(r instanceof Trouter, 'creates new `Trouter` instances');

	t.isObject(r.opts, '~> has `opts` key');
	t.isObject(r.routes, '~> has `routes` key');
	t.isObject(r.handlers, '~> has `handlers` key');

	t.isFunction(r.add, '~> has `add` method');

	METHODS.forEach(str => {
		t.comment(`=== METHOD :: ${str} ===`);
		t.isFunction(r[str.toLowerCase()], `~> has \`${str}\` method`);
		t.isArray(r.routes[str], `~~> has \`routes.${str}\` array`);
		t.isEmpty(r.routes[str], `~~~~> \`routes.${str}\` is an empty array`);
		t.isObject(r.handlers[str], `~~> has \`handlers.${str}\` object`);
		t.isEmpty(r.handlers[str], `~~~~> \`handlers.${str}\` is an empty object`);
	});

	t.end();
});
