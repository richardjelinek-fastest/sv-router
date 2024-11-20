import { type Component } from 'svelte';
import { matchRoute } from './match-route';

export type Routes = {
	[key: `/${string}`]: Component | Routes;
	'*'?: Component;
	layout?: Component<any>;
};

let routes: Routes;
let routeComponent = $state<Component>();
let paramsStore = $state({});

export function createRouter(r: Routes) {
	routes = r;

	return {
		get component() {
			return routeComponent;
		},
		typedPath(path: string) {
			return path;
		},
		params() {
			const readonly = $derived(paramsStore);
			return readonly;
		},
		setup() {
			$effect(() => {
				onNavigate();

				globalThis.addEventListener('popstate', onNavigate);
				globalThis.addEventListener('click', onClick);

				return () => {
					globalThis.removeEventListener('popstate', onNavigate);
					globalThis.removeEventListener('click', onClick);
				};
			});
		},
	};
}

function onNavigate() {
	const { match, params } = matchRoute(globalThis.location.pathname, routes);
	if (match) {
		routeComponent = match;
		paramsStore = params;
	}
}

function onClick(event: MouseEvent) {
	const anchor = (event.target as HTMLElement).closest('a');
	if (!anchor) return;

	const url = new URL(anchor.href);
	const currentOrigin = globalThis.location.origin;
	if (url.origin !== currentOrigin) return;

	event.preventDefault();
	globalThis.history.pushState({}, '', anchor.href);
	onNavigate();
}
