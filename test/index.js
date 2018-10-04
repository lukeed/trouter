const { test, Test } = require('tape');
const Trouter = require('../');

const r = new Trouter();
const $ = Test.prototype;

const METHODS = ['GET', 'HEAD', 'PATCH', 'OPTIONS', 'CONNECT', 'DELETE', 'TRACE', 'POST', 'PUT'];

$.isEmpty = function (val, msg) {
	this.ok(!Object.keys(val).length, msg);
}

$.isString = function (val, msg) {
	this.is(typeof val, 'string', msg);
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

$.isRoute = function (val, obj={}) {
	this.isObject(val, 'route definition is an object');
	this.isArray(val.keys, '~> keys is an Array');
	if (obj.keys) this.same(val.keys, obj.keys, '~~> keys match expected');
	this.true(val.pattern instanceof RegExp, '~> pattern is a RegExp');
	if (obj.route) this.true(val.pattern.test(obj.route), '~~> pattern satisfies route');
	this.isString(val.method, '~> method is a String');
	if (obj.method) this.same(val.method, obj.method, '~~> method matches expected');
	this.isFunction(val.handler, '~> handler is a function');
}

test('exports', t => {
	t.isFunction(Trouter, 'exports a function');
	t.end();
});

test('instance', t => {
	t.true(r instanceof Trouter, 'creates new `Trouter` instances');
	t.isArray(r.routes, '~> has `routes` key (Array)');
	t.isFunction(r.add, '~> has `add` method');
	t.isFunction(r.all, '~> has `all` method');

	METHODS.forEach(str => {
		t.isFunction(r[str.toLowerCase()], `~> has \`${str}\` method`);
	});

	t.end();
});

let val = 123;
test('add()', t => {
	r.add('GET', '/foo/:hello', tt => {
		val = 42;
		tt.pass('runs the GET /foo/:hello handler (find)');
	});

	t.is(r.routes.length, 1, 'added a GET route definition successfully');

	t.isRoute(r.routes[0], {
		method: 'GET',
		keys: ['hello'],
		route: '/foo/bar'
	});

	console.log(' ');

	r.post('/bar', tt => {
		val = 99;
		tt.pass('runs the POST /bar handler (find)');
	});

	t.is(r.routes.length, 2, 'added a POST route definition successfully');
	t.isRoute(r.routes[1], {
		method: 'POST',
		route: '/bar',
		keys: [],
	});

	t.end();
});

test('add() – multiple', t => {
	t.plan(16);

	let foo = 123;

	r.add('SEARCH', '/foobarbaz', () => {
		t.is(foo, 123, '~> foo was 123');
		foo *= 2;
		t.is(foo, 246, '~> foo is now 246');
	}, () => {
		t.is(foo, 246, '~> foo was 246');
		foo += 4;
		t.is(foo, 250, '~> foo is now 250');
	});

	t.is(r.routes.length, 4, 'added two routes for SEARCH into the same `routes` array');

	t.isRoute(r.routes[2]);
	console.log(' ');
	t.isRoute(r.routes[3]);

	console.log(' ');
	r.routes[2].handler();
	r.routes[3].handler();

	t.is(foo, 250, 'foo ended as 250');
});

test('find()', t => {
	t.plan(15);

	let foo = r.find('DELETE', '/nothing');
	t.isObject(foo, 'returns an object when no match');
	// t.is(foo, false, 'returns false when no match');

	let bar = r.find('GET', '/foo/world');
	t.isObject(bar, 'returns an object when has match');
	t.ok(bar.params, `~> has 'params' key`);
	t.is(bar.params.hello, 'world', `~~> pairs the named 'hello' param with its value`);
	t.ok(bar.handlers, `~> has 'handlers' key`);
	t.isArray(bar.handlers, '~~> is an array!');
	bar.handlers[0](t); // +1
	t.is(val, 42, '~> successfully executes the handler');

	console.log(' ');

	let baz = r.find('POST', '/bar');
	t.isObject(baz, 'returns an object when has match');
	t.ok(baz.params, `~> has 'params' key`);
	t.isEmpty(baz.params, `~~> returns empty 'params' even if static route`);
	t.ok(baz.handlers, `~> has 'handlers' key`);
	t.isArray(baz.handlers, '~~> is an array!');
	baz.handlers[0](t); // +1
	t.is(val, 99, '~> successfully executes the handler');
});

test('all()', t => {
	let foo = 0;
	r.all('/greet/:name', _ => foo++);
	t.is(r.routes.length, 5, 'added a route definition for ALL successfully');

	t.isRoute(r.routes[4], {
		method: '', // ~ "ALL"
		keys: ['name'],
		route: '/greet/you'
	});

	console.log(' ');

	let obj1 = r.find('HEAD', '/greet/Bob');
	t.isObject(obj1, 'find(HEAD) returns standard object');
	t.is(obj1.params.name, 'Bob', '~> params operate as normal');
	t.isArray(obj1.handlers, '~> receives `handlers` array');
	t.is(obj1.handlers.length, 1, '~~> array has one item');
	t.isFunction(obj1.handlers[0], '~~> is a function!');

	obj1.handlers[0]();
	t.is(foo, 1, '~~> handler executed successfully');

	console.log(' ');

	let obj2 = r.find('GET', '/greet/Judy');
	t.isObject(obj2, 'find(GET) returns standard object');
	t.is(obj2.params.name, 'Judy', '~> params operate as normal');
	t.isArray(obj2.handlers, '~> receives `handlers` array');
	t.is(obj2.handlers.length, 1, '~~> array has one item');
	t.isFunction(obj2.handlers[0], '~~> is a function!');

	obj2.handlers[0]();
	t.is(foo, 2, '~~> handler executed successfully');

	console.log(' ');

	r.head('/greet/:name', _ => t.pass('>> calls new HEAD handler'));
	t.is(r.routes.length, 6, 'added a route definition for HEAD successfully');
	t.isRoute(r.routes[5], {
		keys: ['name'],
		route: '/greet/you',
		method: 'HEAD'
	});

	console.log(' ');

	let obj3 = r.find('HEAD', '/greet/Rick');
	t.isObject(obj3, 'find(HEAD) returns standard object');
	t.is(obj3.params.name, 'Rick', '~> params operate as normal');
	t.isArray(obj3.handlers, '~> receives `handlers` array');
	t.is(obj3.handlers.length, obj1.handlers.length + 1, '~~> HANDLERS ARE CUMULATIVE');
	t.isFunction(obj3.handlers[0], '~~> is a function!');

	obj3.handlers.forEach(fn => fn());
	t.is(foo, 3, '~~> DOES still run `all()` handler');

	console.log(' ');

	let obj4 = r.find('POST', '/greet/Morty');
	obj4.handlers.forEach(fn => fn());
	t.is(foo, 4, '~> still runs `all()` for methods w/o same pattern');

	t.end();
});
