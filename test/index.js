import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { Trouter } from '../';

const hasNamedGroups = 'groups' in 'x'.match(/x/);

const noop = () => {};
const METHODS = ['GET', 'HEAD', 'PATCH', 'OPTIONS', 'CONNECT', 'DELETE', 'TRACE', 'POST', 'PUT'];

function isRoute(val, obj={}) {
	assert.type(val, 'object', '~> route definition is an object');

	if (obj.keys) {
		assert.instance(val.keys, Array, '~~> keys is an Array');
		assert.equal(val.keys, obj.keys, '~~> keys are expected');
	} else {
		assert.is(val.keys, false, '~~> (RegExp) keys is false')
	}

	assert.instance(val.pattern, RegExp, '~~> pattern is a RegExp');
	if (obj.route) assert.ok(val.pattern.test(obj.route), '~~> pattern satisfies route');

	assert.type(val.method, 'string', '~~> method is a String');
	if (obj.method) assert.equal(val.method, obj.method, '~~> method is expected');

	assert.instance(val.handlers, Array, '~~> handlers is an Array');
	assert.type(val.handlers[0], 'function', '~~> each handler is a Function');
	if (obj.count) assert.is(val.handlers.length, obj.count, `~~> had ${obj.count} handlers`);
}


test('exports', () => {
	assert.type(Trouter, 'function');
});


test('internals', () => {
	const ctx = new Trouter();

	assert.instance(ctx, Trouter, 'creates new `Trouter` instance');
	assert.instance(ctx.routes, Array, '~> has `routes` key (Array)');

	assert.type(ctx.add, 'function', '~> has `add` method');
	assert.type(ctx.find, 'function', '~> has `find` method');
	assert.type(ctx.all, 'function', '~> has `all` method');

	METHODS.forEach(str => {
		assert.type(ctx[str.toLowerCase()], 'function', `~> has \`${str}\` method`);
	});
});


test('add()', () => {
	const ctx = new Trouter();

	let out = ctx.add('GET', '/foo/:hello', noop);
	assert.equal(out, ctx, 'returns the Trouter instance (chainable)');

	// console.log(' ');
	assert.is(ctx.routes.length, 1, 'added "GET /foo/:hello" route successfully');

	isRoute(ctx.routes[0], {
		method: 'GET',
		keys: ['hello'],
		route: '/foo/bar',
		count: 1
	});

	// console.log(' ');
	ctx.post('bar', noop);
	assert.is(ctx.routes.length, 2, 'added "POST /bar" route successfully (via alias)');

	isRoute(ctx.routes[1], {
		keys: [],
		method: 'POST',
		route: '/bar',
		count: 1
	});

	if (hasNamedGroups) {
		// console.log(' ');
		ctx.add('PUT', /^[/]foo[/](?<hello>\w+)[/]?$/, noop);
		assert.is(ctx.routes.length, 3, 'added "PUT /^[/]foo[/](?<hello>\\w+)[/]?$/" route successfully');

		isRoute(ctx.routes[2], {
			keys: null,
			method: 'PUT',
			route: '/foo/bar',
			count: 1
		});
	}
});


test('add() - multiple', () => {
	const ctx = new Trouter();

	ctx.add('SEARCH', '/foo/:hello', [noop, noop]);
	assert.is(ctx.routes.length, 1, 'added "SEARCH /foo/:hello" route successfully');

	isRoute(ctx.routes[0], {
		keys: ['hello'],
		method: 'SEARCH',
		route: '/foo/howdy',
		count: 2
	});

	// console.log(' ');
	ctx.put('/bar', noop, noop, noop);
	assert.is(ctx.routes.length, 2, 'added "PUT /bar" route successfully (via alias)');

	isRoute(ctx.routes[1], {
		keys: [],
		method: 'PUT',
		route: '/bar',
		count: 3
	});
});


test('use()', () => {
	const ctx = new Trouter();

	let out = ctx.use('/foo/:hello', noop);
	assert.equal(out, ctx, 'returns the Trouter instance (chainable)');

	// console.log(' ');
	assert.is(ctx.routes.length, 1, 'added "ANY /foo/:hello" route successfully');

	isRoute(ctx.routes[0], {
		method: '',
		keys: ['hello'],
		route: '/foo/bar',
		count: 1
	});

	// console.log(' ');
	ctx.use('/', [noop, noop, noop]);
	assert.is(ctx.routes.length, 2, 'added "ANY /" routes successfully');

	isRoute(ctx.routes[1], {
		keys: [],
		method: '',
		route: '/',
		count: 3
	});

	// console.log(' ');
	ctx.use('/foo/:world?', noop, [noop, noop], noop);
	assert.is(ctx.routes.length, 3, 'added "ANY /foo/:world?" routes successfully');

	isRoute(ctx.routes[2], {
		keys: ['world'],
		method: '',
		route: '/foo/hello',
		count: 4
	});
});


test('all()', () => {
	let chain = 0;
	const ctx = new Trouter().all('/greet/:name', () => chain++);
	assert.is(ctx.routes.length, 1, 'added "ALL /greet/:name" route');

	isRoute(ctx.routes[0], {
		method: '', // ~> "ALL"
		keys: ['name'],
		route: '/greet/you',
		count: 1,
	});

	// console.log('HEAD /greet/Bob');
	let foo = ctx.find('HEAD', '/greet/Bob');
	assert.is(foo.params.name, 'Bob', '~> "params.name" is expected');
	assert.is(foo.handlers.length, 1, '~~> "handlers" has 1 item');

	chain = 0;
	foo.handlers.forEach(fn => fn(foo));
	assert.is(chain, 1, '~~> handler executed successfully');

	// console.log('GET /greet/Judy');
	let bar = ctx.find('GET', '/greet/Judy');
	assert.is(bar.params.name, 'Judy', '~> "params.name" is expected');
	assert.is(bar.handlers.length, 1, '~~> "handlers" has 1 item');

	chain = 0;
	bar.handlers.forEach(fn => fn(bar));
	assert.is(chain, 1, '~~> handler executed successfully');

	// console.log('~> add(HEAD)');
	ctx.head('/greet/:person', req => {
		assert.is(chain++, 1, '~> ran new HEAD after ALL handler');
		assert.is(req.params.name, 'Rick', '~~> still see "params.name" value');
		assert.is(req.params.person, 'Rick', '~~> receives "params.person" value');
	});

	assert.is(ctx.routes.length, 2, 'added "HEAD /greet/:name" route');

	isRoute(ctx.routes[1], {
		method: 'HEAD', // ~> "ALL"
		keys: ['person'],
		route: '/greet/you',
		count: 1,
	});

	// console.log('HEAD /greet/Rick');
	let baz = ctx.find('HEAD', '/greet/Rick');
	assert.is(baz.params.name, 'Rick', '~> "params.name" is expected');
	assert.is(baz.handlers.length, 2, '~~> "handlers" has 2 items');

	chain = 0;
	baz.handlers.forEach(fn => fn(baz));
	assert.is(chain, 2, '~~> handlers executed successfully');

	// console.log('POST /greet/Morty');
	let bat = ctx.find('POST', '/greet/Morty');
	assert.is(bat.params.name, 'Morty', '~> "params.name" is expected');
	assert.is(bat.handlers.length, 1, '~~> "handlers" has 1 item');

	chain = 0;
	bat.handlers.forEach(fn => fn(bat));
	assert.is(chain, 1, '~~> handler executed successfully');
});


test('find()', () => {
	let chain = 0;
	const ctx = new Trouter();

	ctx.get('/foo/:title',
		req => {
			assert.is(chain++, 1, '~> 1st "GET /foo/:title" ran first');
			assert.is(req.params.title, 'bar', '~> "params.title" is expected');
		}, () => {
			assert.is(chain++, 2, '~> 2nd "GET /foo/:title" ran second');
		}
	);

	const out = ctx.find('GET', '/foo/bar');

	assert.type(out, 'object', 'returns an object');
	assert.type(out.params, 'object', '~> has "params" key (object)');
	assert.is(out.params.title, 'bar', '~~> "params.title" value is correct');

	assert.instance(out.handlers, Array, `~> has "handlers" key (array)`);
	assert.is(out.handlers.length, 2, '~~> saved both handlers');

	chain = 1;
	out.handlers.forEach(fn => fn(out));
	assert.is(chain, 3, '~> executes the handler group sequentially');
});


test('find() - no match', () => {
	const ctx = new Trouter();
	const out = ctx.find('DELETE', '/nothing');

	function isEmpty(input, msg) {
		assert.is(Object.keys(input).length, 0, msg)
	}

	assert.type(out, 'object', 'returns an object');
	isEmpty(out.params, '~> "params" is empty');
	isEmpty(out.handlers, '~> "handlers" is empty');
});


test('find() - multiple', () => {
	let chain = 0;

	const ctx = (
		new Trouter()
			.use('/foo', req => {
				assert.ok('~> ran use("/foo")" route'); // x2
				isRoot || assert.is(req.params.title, 'bar', '~~> saw "param.title" value');
				assert.is(chain++, 0, '~~> ran 1st');
			})
			.get('/foo', req => {
				assert.ok('~> ran "GET /foo" route');
				assert.is(chain++, 1, '~~> ran 2nd');
			})
			.get('/foo/:title?', req => {
				assert.ok('~> ran "GET /foo/:title?" route'); // x2
				isRoot || assert.is(req.params.title, 'bar', '~~> saw "params.title" value');
				isRoot ? assert.is(chain++, 2, '~~> ran 3rd') : assert.is(chain++, 1, '~~> ran 2nd');
			})
			.get('/foo/*', req => {
				assert.ok('~> ran "GET /foo/*" route');
				assert.is(req.params['*'], 'bar', '~~> saw `params["*"]` value');
				assert.is(req.params.title, 'bar', '~~> saw `params.title` value');
				assert.is(chain++, 2, '~~> ran 3rd');
			})
	);

	let isRoot = true;
	// console.log('GET /foo');
	let foo = ctx.find('GET', '/foo');
	assert.is(foo.handlers.length, 3, 'found 3 handlers');

	chain = 0;
	foo.handlers.forEach(fn => fn(foo));
	assert.is(chain, 3);

	isRoot = false;
	// console.log('GET /foo/bar');
	let bar = ctx.find('GET', '/foo/bar');
	assert.is(bar.handlers.length, 3, 'found 3 handlers');

	chain = 0;
	bar.handlers.forEach(fn => fn(bar));
	assert.is(chain, 3);
});


test('find() - HEAD', () => {
	let chain = 0;

	const ctx = (
		new Trouter()
			.all('/foo', () => {
				assert.is(chain++, 0, '~> found "ALL /foo" route');
			})
			.head('/foo', () => {
				assert.is(chain++, 1, '~> found "HEAD /foo" route');
			})
			.get('/foo', () => {
				assert.is(chain++, 2, '~> also found "GET /foo" route');
			})
			.get('/', () => {
				assert.unreachable('should not run');
			})
	);

	const out = ctx.find('HEAD', '/foo');
	assert.is(out.handlers.length, 3, 'found 3 handlers');

	out.handlers.forEach(fn => fn(out));
	assert.is(chain, 3, 'ran handlers sequentially');
});


test('find() - order', () => {
	let chain = 0;

	const ctx = (
		new Trouter()
			.all('/foo', () => {
				assert.is(chain++, 0, '~> ran "ALL /foo" 1st');
			})
			.get('/foo', () => {
				assert.is(chain++, 1, '~> ran "GET /foo" 2nd');
			})
			.head('/foo', () => {
				assert.is(chain++, 2, '~> ran "HEAD /foo" 3rd');
			})
			.get('/', () => {
				assert.unreachable('should not run')
			})
	);

	const out = ctx.find('HEAD', '/foo');
	assert.is(out.handlers.length, 3, 'found 3 handlers');

	out.handlers.forEach(fn => fn(out));
	assert.is(chain, 3, 'ran handlers sequentially');
});


test('find() w/ all()', () => {
	const noop = () => {};
	const find = (x, y) => x.find('GET', y);

	const ctx1 = new Trouter().all('api', noop);
	const ctx2 = new Trouter().all('api/:version', noop);
	const ctx3 = new Trouter().all('api/:version?', noop);
	const ctx4 = new Trouter().all('movies/:title.mp4', noop);

	// console.log('use("/api")');
	assert.is(find(ctx1, '/api').handlers.length, 1, '~> exact match');
	assert.is(find(ctx1, '/api/foo').handlers.length, 0, '~> does not match "/api/foo" - too long');

	// console.log('use("/api/:version")');
	assert.is(find(ctx2, '/api').handlers.length, 0, '~> does not match "/api" only');

	let foo1 = find(ctx2, '/api/v1');
	assert.is(foo1.handlers.length, 1, '~> does match "/api/v1" directly');
	assert.is(foo1.params.version, 'v1', '~> parses the "version" correctly');

	let foo2 = find(ctx2, '/api/v1/users');
	assert.is(foo2.handlers.length, 0, '~> does not match "/api/v1/users" - too long');
	assert.is(foo2.params.version, undefined, '~> cannot parse the "version" parameter (not a match)');

	// console.log('use("/api/:version?")');
	assert.is(find(ctx3, '/api').handlers.length, 1, '~> does match "/api" because optional');

	let bar1 = find(ctx3, '/api/v1');
	assert.is(bar1.handlers.length, 1, '~> does match "/api/v1" directly');
	assert.is(bar1.params.version, 'v1', '~> parses the "version" correctly');

	let bar2 = find(ctx3, '/api/v1/users');
	assert.is(bar2.handlers.length, 0, '~> does match "/api/v1/users" - too long');
	assert.is(bar2.params.version, undefined, '~> cannot parse the "version" parameter (not a match)');

	// console.log('use("/movies/:title.mp4")');
	assert.is(find(ctx4, '/movies').handlers.length, 0, '~> does not match "/movies" directly');
	assert.is(find(ctx4, '/movies/narnia').handlers.length, 0, '~> does not match "/movies/narnia" directly');

	let baz1 = find(ctx4, '/movies/narnia.mp4');
	assert.is(baz1.handlers.length, 1, '~> does match "/movies/narnia.mp4" directly');
	assert.is(baz1.params.title, 'narnia', '~> parses the "title" correctly');

	let baz2 = find(ctx4, '/movies/narnia.mp4/cast');
	assert.is(baz2.handlers.length, 0, '~> does match "/movies/narnia.mp4/cast" - too long');
	assert.is(baz2.params.title, undefined, '~> cannot parse the "title" parameter (not a match)');

});


test('find() w/ use()', () => {
	const noop = () => {};
	const find = (x, y) => x.find('GET', y);

	const ctx1 = new Trouter().use('api', noop);
	const ctx2 = new Trouter().use('api/:version', noop);
	const ctx3 = new Trouter().use('api/:version?', noop);
	const ctx4 = new Trouter().use('movies/:title.mp4', noop);

	// console.log('use("/api")');
	assert.is(find(ctx1, '/api').handlers.length, 1, '~> exact match');
	assert.is(find(ctx1, '/api/foo').handlers.length, 1, '~> loose match');

	// console.log('use("/api/:version")');
	assert.is(find(ctx2, '/api').handlers.length, 0, '~> does not match "/api" only');

	let foo1 = find(ctx2, '/api/v1');
	assert.is(foo1.handlers.length, 1, '~> does match "/api/v1" directly');
	assert.is(foo1.params.version, 'v1', '~> parses the "version" correctly');

	let foo2 = find(ctx2, '/api/v1/users');
	assert.is(foo2.handlers.length, 1, '~> does match "/api/v1/users" loosely');
	assert.is(foo2.params.version, 'v1', '~> parses the "version" correctly');

	// console.log('use("/api/:version?")');
	assert.is(find(ctx3, '/api').handlers.length, 1, '~> does match "/api" because optional');

	let bar1 = find(ctx3, '/api/v1');
	assert.is(bar1.handlers.length, 1, '~> does match "/api/v1" directly');
	assert.is(bar1.params.version, 'v1', '~> parses the "version" correctly');

	let bar2 = find(ctx3, '/api/v1/users');
	assert.is(bar2.handlers.length, 1, '~> does match "/api/v1/users" loosely');
	assert.is(bar2.params.version, 'v1', '~> parses the "version" correctly');

	// console.log('use("/movies/:title.mp4")');
	assert.is(find(ctx4, '/movies').handlers.length, 0, '~> does not match "/movies" directly');
	assert.is(find(ctx4, '/movies/narnia').handlers.length, 0, '~> does not match "/movies/narnia" directly');

	let baz1 = find(ctx4, '/movies/narnia.mp4');
	assert.is(baz1.handlers.length, 1, '~> does match "/movies/narnia.mp4" directly');
	assert.is(baz1.params.title, 'narnia', '~> parses the "title" correctly');

	let baz2 = find(ctx4, '/movies/narnia.mp4/cast');
	assert.is(baz2.handlers.length, 1, '~> does match "/movies/narnia.mp4/cast" loosely');
	assert.is(baz2.params.title, 'narnia', '~> parses the "title" correctly');

});


if (hasNamedGroups) {
	test('find() - regex w/ named groups', () => {
		let chain = 0;
		const ctx = new Trouter();

		ctx.get(/^[/]foo[/](?<title>\w+)[/]?$/,
			req => {
				assert.is(chain++, 1, '~> 1st "GET /^[/]foo[/](?<title>\\w+)[/]?$/" ran first');
				assert.is(req.params.title, 'bar', '~> "params.title" is expected');
			},
			req => {
				assert.is(chain++, 2, '~> 2nd "GET /^[/]foo[/](?<title>\\w+)[/]?$/" ran second');
			}
		);

		const out = ctx.find('GET', '/foo/bar');

		assert.type(out, 'object', 'returns an object');
		assert.type(out.params, 'object', '~> has "params" key (object)');
		assert.is(out.params.title, 'bar', '~~> "params.title" value is correct');

		assert.instance(out.handlers, Array, `~> has "handlers" key (array)`);
		assert.is(out.handlers.length, 2, '~~> saved both handlers');

		chain = 1;
		out.handlers.forEach(fn => fn(out));
		assert.is(chain, 3, '~> executes the handler group sequentially');
	});


	test('find() - multiple regex w/ named groups', () => {
		let chain = 0;

		const ctx = (
			new Trouter()
				.use('/foo', req => {
					assert.ok('~> ran use("/foo")" route'); // x2
					isRoot || assert.is(req.params.title, 'bar', '~~> saw "params.title" value');
					assert.is(chain++, 0, '~~> ran 1st');
				})
				.get('/foo', req => {
					assert.ok('~> ran "GET /foo" route');
					assert.is(chain++, 1, '~~> ran 2nd');
				})
				.get(/^[/]foo(?:[/](?<title>\w+))?[/]?$/, req => {
					assert.ok('~> ran "GET /^[/]foo[/](?<title>\\w+)?[/]?$/" route'); // x2
					isRoot || assert.is(req.params.title, 'bar', '~~> saw "params.title" value');
					isRoot ? assert.is(chain++, 2, '~~> ran 3rd') : assert.is(chain++, 1, '~~> ran 2nd');
				})
				.get(/^[/]foo[/](?<wild>.*)$/, req => {
					assert.ok('~> ran "GET /^[/]foo[/](?<wild>.*)$/" route');
					assert.is(req.params.wild, 'bar', '~~> saw `params.wild` value');
					assert.is(req.params.title, 'bar', '~~> saw `params.title` value');
					assert.is(chain++, 2, '~~> ran 3rd');
				})
		);

		let isRoot = true;
		// console.log('GET /foo');
		let foo = ctx.find('GET', '/foo');
		assert.is(foo.handlers.length, 3, 'found 3 handlers');

		chain = 0;
		foo.handlers.forEach(fn => fn(foo));

		isRoot = false;
		// console.log('GET /foo/bar');
		let bar = ctx.find('GET', '/foo/bar');
		assert.is(bar.handlers.length, 3, 'found 3 handlers');

		chain = 0;
		bar.handlers.forEach(fn => fn(bar));
	});
}

test.run();
