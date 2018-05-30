type Match = {
	params: {[key: string]: any},
	handler: Function,
}

declare class Trouter {
	/**
	 * @constructor Initializes a new Trouter instance. Currently accepts no options.
	 */
	constructor();

	/**
	 * @param method Any valid HTTP method name.
	 * @param pattern The routing pattern to match on.
	 * @param handler The function that should be tied to this pattern.
	 */
	add(method: string, pattern: string, handler: Function): this;

	/**
	 * @param pattern The routing pattern to match on.
	 * @param handler The function that should be tied to this pattern.
	 */
	all(pattern: string, handler: Function): this;

	/**
	 * @param pattern The routing pattern to match on.
	 * @param handler The function that should be tied to this pattern.
	 */
	get(pattern: string, handler: Function): this;

	/**
	 * @param pattern The routing pattern to match on.
	 * @param handler The function that should be tied to this pattern.
	 */
	post(pattern: string, handler: Function): this;

	/**
	 * @param pattern The routing pattern to match on.
	 * @param handler The function that should be tied to this pattern.
	 */
	patch(pattern: string, handler: Function): this;

	/**
	 * @param pattern The routing pattern to match on.
	 * @param handler The function that should be tied to this pattern.
	 */
	put(pattern: string, handler: Function): this;

	/**
	 * @param pattern The routing pattern to match on.
	 * @param handler The function that should be tied to this pattern.
	 */
	delete(pattern: string, handler: Function): this;

	/**
	 * @param method Any valid HTTP method name.
	 * @param url The URL used to match against pattern definitions. This is typically req.url.
	 * @returns This method will return false if no match is found. Otherwise it returns an Object with params and handler keys.
	 */
	find(method: string, url: string): Match | boolean;
}

export = Trouter;
