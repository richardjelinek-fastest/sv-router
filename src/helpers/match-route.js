/**
 * @typedef {import('../index.d.ts').LayoutComponent} LayoutComponent
 *
 * @typedef {import('../index.d.ts').RouteComponent} RouteComponent
 *
 * @typedef {import('../index.d.ts').Hooks} Hooks
 *
 * @typedef {import('../index.d.ts').Routes} Routes
 *
 * @typedef {import('../index.d.ts').RouteMeta} RouteMeta
 */

/**
 * @param {string} path
 * @param {Routes} routes
 * @param {string} [catchingAllFrom]
 * @returns {{
 * 	match: RouteComponent | undefined;
 * 	layouts: LayoutComponent[];
 * 	hooks: Hooks[];
 * 	meta: RouteMeta;
 * 	params: Record<string, string>;
 * 	breakFromLayouts: boolean;
 * }}
 */
export function matchRoute(path, routes, catchingAllFrom) {
	let pathname = new URL(path, globalThis.location.origin).pathname;
	// Remove trailing slash
	if (pathname.length > 1 && pathname.endsWith('/')) {
		pathname = pathname.slice(0, -1);
	}
	const pathParts = pathname.split('/').slice(1);
	const sortedRoutes = sortRoutes(Object.keys(routes));

	const result = findMatchingRoute(routes, pathParts, sortedRoutes, catchingAllFrom);
	if (!result.match) {
		catchingAllFrom = pathname;
	}
	do {
		const catchAllResult = findMatchingRoute(routes, pathParts, sortedRoutes, catchingAllFrom);
		result.match = catchAllResult.match;
		catchingAllFrom = catchingAllFrom?.split("/").slice(0, -1).join("/");
	} while (!result.match && catchingAllFrom)
	return { ...result, layouts: [...result.layouts] };
}

/**
 * @param {Routes} routes
 * @param {string[]} pathParts
 * @param {string[]} sortedRoutes
 * @param {string} [catchingAllFrom]
 */
function findMatchingRoute(routes, pathParts, sortedRoutes, catchingAllFrom) {
	/**
	 * @type {{
	 * 	match: RouteComponent | undefined;
	 * 	layouts: Set<LayoutComponent>;
	 * 	hooks: Hooks[];
	 * 	params: Record<string, string>;
	 * 	meta: RouteMeta;
	 * 	breakFromLayouts: boolean;
	 * }}
	 */
	const response = {
		match: undefined,
		layouts: new Set(),
		hooks: [],
		params: {},
		meta: {},
		breakFromLayouts: false,
	};

	for (const route of sortedRoutes) {
		const routeParts = route.split('/');
		if (routeParts[0] === '') routeParts.shift();

		for (let [index, routePart] of routeParts.entries()) {
			response.breakFromLayouts = routePart.startsWith('(') && routePart.endsWith(')');
			if (response.breakFromLayouts) {
				routePart = routePart.slice(1, -1);
			}

			const pathPart = pathParts[index];
			const path = `/${routeParts.slice(0, index).join("/")}`;
			if (
				routePart.startsWith('*') && catchingAllFrom === path
			) {
				const param = routePart.slice(1);
				if (param) {
					response.params[param] = pathParts.slice(index).join('/');
				}
				if (response.breakFromLayouts) {
					routePart = `(${routePart})`;
				} else if ('layout' in routes && routes.layout) {
					response.layouts.add(routes.layout);
				}
				const resolvedPath = /** @type {keyof Routes} */ (
					(index ? '/' : '') + routeParts.join('/')
				);
				response.match = /** @type {RouteComponent} */ (routes[resolvedPath]);
				return response;
			}

			if (routePart.startsWith(':')) {
				response.params[routePart.slice(1)] = pathPart;
			} else if (routePart !== pathPart?.toLowerCase()) {
				break;
			}

			if (index !== routeParts.length - 1) {
				continue;
			}

			const routeMatch = /** @type {RouteComponent} */ (
				routes[/** @type {keyof Routes} */ ('/' + routeParts.join('/'))]
			);

			if (!response.breakFromLayouts && 'layout' in routes && routes.layout) {
				response.layouts.add(routes.layout);
			}

			if ('hooks' in routes && routes.hooks) {
				response.hooks.push(routes.hooks);
			}

			if ('meta' in routes && routes.meta) {
				response.meta = { ...response.meta, ...routes.meta };
			}

			if (typeof routeMatch === 'function') {
				if (routeParts.length === pathParts.length && !catchingAllFrom) {
					response.match = routeMatch;
					return response;
				}
				continue;
			}

			const nestedPathname = '/' + pathParts.slice(index + 1).join('/');
			const result = matchRoute(nestedPathname, routeMatch, path);
			if (result) {
				response.match = result.match;
				response.params = { ...response.params, ...result.params };
				response.hooks.push(...result.hooks);
				response.meta = { ...response.meta, ...result.meta };
				if (result.breakFromLayouts) {
					response.layouts.clear();
				} else {
					for (const layout of result.layouts) {
						response.layouts.add(layout);
					}
				}
			}
			if (!catchingAllFrom) {
				return response;
			}
		}
	}
	return response;
}

/**
 * @param {string[]} routes
 * @returns {string[]}
 */
export function sortRoutes(routes) {
	return routes.toSorted((a, b) => {
		const splitA = a.split("/");
		const splitB = b.split("/");
		return splitA.reduce((acc, a) => acc + getRoutePriority(a), 0) - splitB.reduce((acc, b) => acc + getRoutePriority(b), 0);
	});
}

/**
 * @param {string} route
 * @returns {number}
 */
function getRoutePriority(route) {
	if (route === '' || route === '/') return 1;
	if (route.startsWith('*') || route.startsWith('(*')) return 4;
	if (route.includes(':')) return 3;
	return 2;
}
