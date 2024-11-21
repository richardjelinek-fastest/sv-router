import type { Component } from 'svelte';

export type Routes = {
	[key: `/${string}`]: Component | Routes;
	'*'?: Component;
	layout?: Component<any>;
};
