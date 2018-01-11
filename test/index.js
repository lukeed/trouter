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

let val = 123;
test('add()', t => {
	r.add('GET', '/foo/:hello', tt => {
		val = 42;
		tt.pass('runs the GET /foo/:hello handler (find)');
	});

	t.is(r.routes.GET.length, 1, 'adds a GET route definition successfully');
	t.isArray(r.routes.GET[0], 'parses the pattern into an array of segments');
	t.is(r.routes.GET[0].length, 2, '~~> has 2 segment (static + param)');
	t.isObject(r.routes.GET[0][0], '~~> array segments are objects');
	t.is(Object.keys(r.handlers.GET).length, 1, 'adds a GET route handler successfully');
	t.isFunction(r.handlers.GET['/foo/:hello'], 'saves the handler function as is');

	r.post('/bar', tt => {
		val = 99;
		tt.pass('runs the POST /bar handler (find)');
	});

	t.is(r.routes.POST.length, 1, 'adds a POST route definition successfully');
	t.isArray(r.routes.POST[0], 'parses the pattern into an array of segments');
	t.is(r.routes.POST[0].length, 1, '~~> has only 1 segment (static)');
	t.isObject(r.routes.POST[0][0], '~~> array segments are objects');
	t.is(Object.keys(r.handlers.POST).length, 1, 'adds a POST route handler successfully');
	t.isFunction(r.handlers.POST['/bar'], 'saves the handler function as is');

	t.end();
});

test('find()', t => {
	t.plan(13);

	let foo = r.find('DELETE', '/nothing');
	t.is(foo, false, 'returns false when no match');

	let bar = r.find('GET', '/foo/world');
	t.isObject(bar, 'returns an object when has match');
	t.ok(bar.params, `~> has 'params' key`);
	t.is(bar.params.hello, 'world', `~~> pairs the named 'hello' param with its value`);
	t.ok(bar.handler, `~> has 'handler' key`);
	bar.handler(t); // +1
	t.is(val, 42, '~> successfully executes the handler');

	let baz = r.find('POST', '/bar');
	t.isObject(baz, 'returns an object when has match');
	t.ok(baz.params, `~> has 'params' key`);
	t.isEmpty(baz.params, `~~> returns empty 'params' even if static route`);
	t.ok(baz.handler, `~> has 'handler' key`);
	baz.handler(t); // +1
	t.is(val, 99, '~> successfully executes the handler');
});
