const { METHODS } = require('http');
const { test, Test } = require('tape');
const Trouter = require('../');

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
	t.isFunction(r.all, '~> has `all` method');

	METHODS.forEach(str => {
		t.comment(`=== METHOD :: ${str} ===`);
		t.isFunction(r[str.toLowerCase()], `~> has \`${str}\` method`);
		t.is(r.routes[str], undefined, `~~> \`routes.${str}\` undefined initially`);
		t.is(r.handlers[str], undefined, `~~> \`handlers.${str}\` undefined initially`);
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
	t.isArray(r.handlers.GET['/foo/:hello'], 'spreads the handler function into array');
	t.isFunction(r.handlers.GET['/foo/:hello'][0], '~> item is function');

	r.post('/bar', tt => {
		val = 99;
		tt.pass('runs the POST /bar handler (find)');
	});

	t.is(r.routes.POST.length, 1, 'adds a POST route definition successfully');
	t.isArray(r.routes.POST[0], 'parses the pattern into an array of segments');
	t.is(r.routes.POST[0].length, 1, '~~> has only 1 segment (static)');
	t.isObject(r.routes.POST[0][0], '~~> array segments are objects');
	t.is(Object.keys(r.handlers.POST).length, 1, 'adds a POST route handler successfully');
	t.isArray(r.handlers.POST['/bar'], 'spreads the handler function into array');
	t.isFunction(r.handlers.POST['/bar'][0], '~> item is function');

	t.end();
});

test('add() – multiple', t => {
	t.plan(10);

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

	let tmp = r.handlers.SEARCH;
	t.is(Object.keys(tmp).length, 1, 'adds a SEARCH route handler successfully');
	t.isArray(tmp['/foobarbaz'], 'spreads the handler function into array');
	t.is(tmp['/foobarbaz'].length, 2, '~> contains two items');

	tmp['/foobarbaz'].forEach(x => {
		t.isFunction(x, '~~> is a function');
		x();
	});

	t.is(foo, 250, 'foo ended as 250');
});

test('find()', t => {
	t.plan(15);

	let foo = r.find('DELETE', '/nothing');
	t.is(foo, false, 'returns false when no match');

	let bar = r.find('GET', '/foo/world');
	t.isObject(bar, 'returns an object when has match');
	t.ok(bar.params, `~> has 'params' key`);
	t.is(bar.params.hello, 'world', `~~> pairs the named 'hello' param with its value`);
	t.ok(bar.handlers, `~> has 'handlers' key`);
	t.isArray(bar.handlers, '~~> is an array!');
	bar.handlers[0](t); // +1
	t.is(val, 42, '~> successfully executes the handler');

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
	t.is(r.routes.HEAD, undefined, '`routes.HEAD` is not defined');
	t.is(r.handlers.HEAD, undefined, '`handlers.HEAD` is not defined');

	let foo = 0;
	r.all('/greet/:name', _ => foo++);

	t.is(r.routes.HEAD, undefined, '`routes.HEAD` (still) undefined');
	t.is(r.handlers.HEAD, undefined, '`handlers.HEAD` (still) undefined');
	t.isObject(r.handlers['*'], '`handlers["*"]` now exists as object');
	t.isArray(r.routes['*'], '`routes["*"]` now exists as array');

	let obj1 = r.find('HEAD', '/greet/Bob');
	t.isObject(obj1, 'find(HEAD) returns standard object');
	t.is(obj1.params.name, 'Bob', '~> params operate as normal');
	t.isArray(obj1.handlers, '~> receives `handlers` array');
	t.is(obj1.handlers.length, 1, '~~> array has one item');
	t.isFunction(obj1.handlers[0], '~~> is a function!');

	obj1.handlers[0]();
	t.is(foo, 1, '~~> handler executed successfully');

	let obj2 = r.find('GET', '/greet/Judy');
	t.isObject(obj2, 'find(GET) returns standard object');
	t.is(obj2.params.name, 'Judy', '~> params operate as normal');
	t.isArray(obj2.handlers, '~> receives `handlers` array');
	t.is(obj2.handlers.length, 1, '~~> array has one item');
	t.isFunction(obj2.handlers[0], '~~> is a function!');

	obj2.handlers[0]();
	t.is(foo, 2, '~~> handler executed successfully');

	// Now add same definition to HEAD, overrides
	r.head('/greet/:name', _ => t.pass('>> calls new HEAD handler'));
	t.isObject(r.handlers.HEAD, 'now `handlers.HEAD` is object');
	t.isArray(r.routes.HEAD, 'now `routes.HEAD` is array');

	let obj3 = r.find('HEAD', '/greet/Rick');
	t.isObject(obj3, 'find(HEAD) returns standard object');
	t.is(obj3.params.name, 'Rick', '~> params operate as normal');
	t.isArray(obj3.handlers, '~> receives `handlers` array');
	t.is(obj3.handlers.length, 1, '~~> array has one item');
	t.isFunction(obj3.handlers[0], '~~> is a function!');

	obj3.handlers[0]();
	t.is(foo, 2, '>> does NOT run `all()` handler anymore');

	let obj4 = r.find('POST', '/greet/Morty');
	obj4.handlers[0]();
	t.is(foo, 3, '~> still runs `all()` for methods w/o same pattern');

	t.end();
});
