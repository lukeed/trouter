const Table = require('cli-table2');
const { Suite } = require('benchmark');
const Trouter = require('../lib');

const routes = [
	['GET', '/', '/'],
	['POST', '/users', '/users'],
	['GET', '/users/:id', '/users/123'],
	['PUT', '/users/:id/books/:title?', '/users/123/books'],
	['DELETE', '/users/:id/books/:title', '/users/123/books/foo']
];

const trouter = new Trouter();

routes.forEach(arr => {
	trouter.add(arr[0], arr[1], noop);
});

// Generate & Run all suites
routes.forEach(arr => {
	let name = `${arr[0]} ${arr[1]}`;
	new Suite()
		.add(name, _ => trouter.find(arr[0], arr[2]))
		.on('cycle', onCycle)
		.on('complete', onComplete)
		.run();
});

// ~~~~~

function noop() {
	//
}

function onCycle(ev) {
	console.log(String(ev.target));
}

function onComplete() {
	console.log('Fastest is ' + this.filter('fastest').map('name'));

	const tbl = new Table({
		head: ['Name', 'Mean time', 'Ops/sec', 'Diff']
	});

	let prev, diff;
	this.forEach(el => {
		diff = prev ? (((el.hz - prev) * 100 / prev).toFixed(2) + '% faster') : 'N/A';
		tbl.push([el.name, el.stats.mean, el.hz.toLocaleString(), diff])
		prev = el.hz;
	});
	console.log(tbl.toString());
}
