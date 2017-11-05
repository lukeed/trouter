const test = require('tape');
const fn = require('../lib');

test('exports', t => {
	t.is(typeof fn, 'function', 'exports a function');
	t.end();
});
