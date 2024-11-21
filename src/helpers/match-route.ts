import type { Component } from 'svelte';
import type { Routes } from '../types';

export function matchRoute(
	pathname: string,
	routes: Routes,
): { match: Component | undefined; params: Record<string, string> } {
	const pathParts = pathname.split('/');
	const allRouteParts = Object.keys(routes).map((route) => route.split('/'));

	let match: Component | undefined;
	let params: Record<string, string> = {};

	outer: for (const routeParts of allRouteParts) {
		for (const [index, routePart] of routeParts.entries()) {
			const pathPart = pathParts[index];
			if (routePart.startsWith(':')) {
				params[routePart.slice(1)] = pathPart;
			} else if (routePart === '*') {
				match = routes[routeParts.join('/') as keyof Routes] as Component;
				break outer;
			} else if (routePart !== pathPart) {
				break;
			}
			if (index === routeParts.length - 1) {
				const routeMatch = routes[routeParts.join('/') as keyof Routes];
				if (typeof routeMatch === 'function') {
					if (routeParts.length === pathParts.length) {
						match = routeMatch;
					} else {
						continue;
					}
				} else if (routeMatch) {
					const nestedPathname = '/' + pathParts.slice(index + 1).join('/');
					const result = matchRoute(nestedPathname, routeMatch);
					if (result) {
						match = result.match;
						params = { ...params, ...result.params };
					}
				}
				break outer;
			}
		}
	}

	return { match, params };
}
