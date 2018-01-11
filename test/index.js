const { test, Test } = require('tape');
const Trouter = require('../lib');

const r = new Trouter();
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
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

	let arr, obj;
	t.isObject(r.opts, '~> has `opts` key');
	t.isObject(r.routes, '~> has `routes` key');
	t.isObject(r.handlers, '~> has `handlers` key');
	METHODS.forEach(str => {
		arr=r.routes[str]; obj=r.handlers[str];
		t.true(Array.isArray(arr), `~~> has \`routes.${str}\` array`);
		t.is(typeof obj, 'object', `~~> has \`handlers.${str}\` object`);
		t.is(arr.length, 0, `~~> \`routes.${str}\` is an empty array`);
		t.is(Object.keys(obj).length, 0, `~~> \`handlers.${str}\` is an empty object`);
	});

	t.is(typeof r.add, 'function', '~> has `add` function');
	t.is(typeof r.get, 'function', '~> has `get` function');
	t.is(typeof r.post, 'function', '~> has `post` function');
	t.is(typeof r.delete, 'function', '~> has `delete` function');
	t.is(typeof r.put, 'function', '~> has `put` function');

	t.end();
});
