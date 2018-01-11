# trouter [![Build Status](https://travis-ci.org/lukeed/trouter.svg?branch=master)](https://travis-ci.org/lukeed/trouter)

> 🐟 A fast, small-but-mighty, familiar ~fish~ router


## Install

```
$ npm install --save trouter
```


## Usage

```js
const Trouter = require('trouter');
const router = new Trouter();

// Define all routes
router
  .get('/users', _ => {
    console.log('> Getting all users');
  })
  .add('POST', '/users', _ => {
    console.log('~> Adding a user');
  })
  .get('/users/:id', val => {
    console.log('~> Getting user with ID:', val);
  });

// Find a route definition
let obj = router.find('GET', '/users/123');
//=> obj.params ~> { id:123 }
//=> obj.handler ~> Function

// Execute the handler, pass value
obj.handler( obj.params.id );
//=> ~> Getting user with ID: 123

// Returns `false` if no match
router.find('DELETE', '/foo');
//=> false
```

## API

### Trouter()

Initializes a new `Trouter` instance. Currently accepts no options.

### trouter.add(method, pattern, handler)
Returns: `self`

Stores a `method` + `pattern` pairing internally, along with its handler.

#### method
Type: `String`

Any valid HTTP method name.

#### pattern
Type: `String`

Unlike most router libraries, Trouter does not use `RegExp` to determine pathname matches. Instead, it uses string comparison which is much faster, but also limits the pattern complexity.

The supported pattern types are:

* static (`/users`)
* named parameters (`/users/:id`)
* nested parameters (`/users/:id/books/:title`)
* optional parameters (`/users/:id?/books/:title?`)
* any match / wildcards (`/users/*`)

#### handler
Type: `Function`

The function that should be tied to this `pattern`.

> **Important:** Trouter does not care what your function signature looks like!<br> You are not bound to the `(req, res)` standard.

### trouter.find(method, url)
Returns: `Object|Boolean`<br>
Searches within current instance for a `method` + `pattern` pairing that matches the current `method` + `url`.

This method will return `false` if no match is found. Otherwise it returns an Object with `params` and `handler` keys.

#### method
Type: `String`

Any valid HTTP method name.

#### url
Type: `String`

The URL used to match against pattern definitions. This is typically `req.url`.

### trouter.METHOD(pattern, handler)

This is an alias for [`trouter.add(METHOD, pattern, handler)`](#trouteraddmethod-pattern-handler), where `METHOD` is **any** lowercased HTTP method name.

```js
const noop = _ => {}:
const app = new Trouter();

app.get('/users/:id', noop);
app.post('/users', noop);
app.patch('/users/:id', noop);

// less common methods too
app.trace('/foo', noop);
app.purge('/bar', noop);
app.copy('/baz', noop);
```


## Benchmarks

> Run on Node v6.11.1

```
GET / ON /
  --> 6,621,618 ops/sec ±1.43% (91 runs sampled)

POST /users ON /users
  --> 2,180,156 ops/sec ±1.06% (91 runs sampled)

GET /users/123 ON /users/:id
  --> 1,126,468 ops/sec ±0.44% (93 runs sampled)

PUT /users/123/books ON /users/:id/books/:title?
  --> 1,003,157 ops/sec ±0.43% (94 runs sampled)

DELETE /users/123/books/foo ON /users/:id/books/:title
  --> 827,550 ops/sec ±0.53% (91 runs sampled)
```

## License

MIT © [Luke Edwards](https://lukeed.com)
