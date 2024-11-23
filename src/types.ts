import type { Component, Snippet } from 'svelte';

type BaseProps = Record<string, any>;

export type LazyRouteComponent<Props extends BaseProps = BaseProps> = () => Promise<{
	default: Component<Props>;
}>;

export type RouteComponent<Props extends BaseProps = BaseProps> =
	| Component<Props>
	| LazyRouteComponent<Props>;

export type LayoutComponent = RouteComponent<{ children: Snippet }>;

export type Routes = {
	[key: `/${string}`]: RouteComponent | Routes;
	'*'?: RouteComponent;
	layout?: LayoutComponent;
};
