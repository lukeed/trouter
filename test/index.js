const test = require('tape');
const Trouter = require('../lib');

const r = new Trouter();
const METHODS = ['get', 'post', 'put', 'delete'];

test('exports', t => {
	t.is(typeof Trouter, 'function', 'exports a function');
	t.end();
});

test('instance', t => {
	t.true(r instanceof Trouter, 'creates new `Trouter` instances');
	t.is(typeof r.opts, 'object', '~> has `opts` key');
	t.is(typeof r.routes, 'object', '~> has `routes` key');
	t.is(typeof r.handlers, 'object', '~> has `handlers` key');

	let arr, obj;
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
