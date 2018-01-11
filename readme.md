# trouter [![Build Status](https://travis-ci.org/lukeed/trouter.svg?branch=master)](https://travis-ci.org/lukeed/trouter)

> WIP


## Install

```
npm install --save trouter
```


## Usage

```js
const trouter = require('trouter');
```

## API

### trouter()



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
