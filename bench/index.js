const { Suite } = require('benchmark');
const { Trouter } = require('../');

const noop = () => {}
const onCycle = (ev) => console.log(String(ev.target));

const routes = [
	['GET', '/', '/'],
	['POST', '/users', '/users'],
	['GET', '/users/:id', '/users/123'],
	['PUT', '/users/:id/books/:title?', '/users/123/books'],
	['DELETE', '/users/:id/books/:title', '/users/123/books/foo'],
	['PATCH', /^[/]users[/](?<id>\d+)[/]?$/, '/users/456'],
	['OPTIONS', /^[/]users[/](?<id>\d+)[/]books[/](?<title>[^/]+)[/]?$/, '/users/456/books/foo']
];

const trouter = new Trouter();

routes.forEach(arr => {
	trouter.add(arr[0], arr[1], noop);
});

trouter.all('/hello', noop);

// Generate & Run all suites
routes.forEach(arr => {
	let name = `${arr[0]} ${arr[1]}`;
	new Suite()
		.add(name, _ => trouter.find(arr[0], arr[2]))
		.on('cycle', onCycle)
		.run();
});

new Suite()
	.add('HEAD /hello (all)', _ => trouter.find('HEAD', '/hello'))
	.on('cycle', onCycle)
	.run();
