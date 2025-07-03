import type { Component, Snippet } from 'svelte';
import type { Action } from 'svelte/action';
import type { ClassValue } from 'svelte/elements';

/**
 * A Svelte action that will add a class to the anchor if its `href` matches the current route. It
 * can have an optional `className` parameter to specify the class to add, otherwise it will default
 * to `is-active`.
 *
 * ```svelte
 * <a href={p('/about')} use:isActiveLink={{ className: 'active-link' }}>
 * ```
 */
export const isActiveLink: IsActiveLink;

/**
 * Setup a new router instance with the given routes.
 *
 * ```js
 * export const { p, navigate, isActive, route } = createRouter({
 *   '/': Home,
 *   '/about': About,
 *   ...
 * });
 * ```
 */
export function createRouter<T extends Routes>(r: T): RouterApi<T>;

/**
 * The component that will render the current route. You can pass a `base` prop to set the base path
 * that is prepended to every url.
 */
export const Router: Component<{ base?: string }>;

/**
 * The reactive search params of the URL. It is just a wrapper around `SvelteURLSearchParam` that
 * will update the url on change.
 */
export const searchParams: SearchParams;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type BaseProps = {};

export type LazyRouteComponent<Props extends BaseProps = BaseProps> = () => Promise<{
	default: Component<Props>;
}>;

export type RouteComponent<Props extends BaseProps = any> =
	| Component<Props>
	| LazyRouteComponent<Props>;
export type LayoutComponent = RouteComponent<{ children: Snippet }>;
export type Hooks = {
	/**
	 * A function that will be called before the route is loaded. If it returns a promise, the route
	 * will wait for it to resolve before loading.
	 *
	 * You can throw a `navigate` call to redirect to another route.
	 *
	 * ```js
	 * async beforeLoad({ pathname }) {
	 *   await ...
	 *   throw navigate('/home');
	 * }
	 * ```
	 */
	beforeLoad?(context: HooksContext): void | Promise<void>;
	/** A function that will be called after the route is loaded. */
	afterLoad?(context: HooksContext): void;
	/** A function that will be called when the route is preloaded. */
	onPreload?(context: HooksContext): void;
};

export type Routes = {
	[_: `/${string}`]: RouteComponent | Routes;
	[_: `*${string}` | `(*${string})`]: RouteComponent | undefined;
	layout?: LayoutComponent;
	hooks?: Hooks;
	meta?: RouteMeta;
};

export type IsActiveLink = Action<
	HTMLAnchorElement,
	| {
			class?: ClassValue;
			/** @deprecated Use `class` instead. */
			className?: string;
			startsWith?: boolean;
	  }
	| undefined
>;

/**
 * Route metadata that can be extended via module augmentation.
 *
 * @example
 * 	declare module 'sv-router' {
 * 		interface RouteMeta {
 * 			public?: boolean;
 * 			requiresAuth?: boolean;
 * 		}
 * 	}
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RouteMeta {}

export type RouterApi<T extends Routes> = {
	/**
	 * Construct a path while ensuring type safety.
	 *
	 * ```js
	 * p('/users');
	 * // With parameters
	 * p('/users/:id', { id: 1 });
	 * ```
	 *
	 * @param route The route to navigate to.
	 * @param params The parameters to replace in the route.
	 */
	p<U extends Path<T>>(...args: ConstructPathArgs<U>): string;

	/**
	 * Navigate programmatically to a route.
	 *
	 * ```js
	 * navigate('/users');
	 * // With parameters
	 * navigate('/users/:id', {
	 * 	params: {
	 * 		id: 1,
	 * 	},
	 * });
	 * // Back and forward
	 * navigate(-1);
	 * navigate(2);
	 * ```
	 *
	 * @param route The route to navigate to.
	 * @param options The navigation options.
	 *
	 *   Returns an Error for use with `throw navigate(...)` inside hooks.
	 */
	navigate<U extends Path<T>>(...args: NavigateArgs<U>): Error;

	/**
	 * Will return `true` if the given path is active.
	 *
	 * Can be used with params to check the exact path, or without to check for any params in the
	 * path.
	 *
	 * @param path The route to check.
	 * @param params The optional parameters to replace in the route.
	 */
	isActive: {
		<U extends Path<T>>(...args: IsActiveArgs<U>): boolean;
		startsWith<U extends Path<T>>(...args: IsActiveArgs<U>): boolean;
	};

	/**
	 * Preloads the given route.
	 *
	 * @param path The route to preload.
	 */
	preload<U extends Path<T>>(path: U): Promise<void>;

	route: {
		/**
		 * An object containing the parameters of the current route.
		 *
		 * For example, given the route `/posts/:slug/comments/:commentId` and the URL
		 * `http://localhost:5173/posts/hello-world/comments/123`, the `params` object would be `{ slug:
		 * 'hello-world', commentId: '123' }`.
		 */
		params: AllParams<T>;
		/**
		 * Extract parameters from the given pathname. Will throw if the pathname does not match the
		 * current route.
		 *
		 * ```ts
		 * route.getParams('/posts/:slug').slug;
		 * ```
		 *
		 * @param pathname
		 */
		getParams<U extends Path<T>>(pathname: U): Record<ExtractParams<U>, string>;
		/** The reactive pathname of the URL. */
		pathname: (Path<T, true> & {}) | (string & {});
		/** The reactive query string part of the URL. */
		search: string;
		/** The reactive history state that can be passed to the `navigate` function. */
		state: unknown;
		/** The reactive hash part of the URL. */
		hash: string;
		/** Arbitrary metadata associated with the route. */
		meta: RouteMeta;
	};
};

export type Path<T extends Routes, AnyParam extends boolean = false> = RemoveParenthesis<
	RemoveLastSlash<RecursiveKeys<StripNonRoutes<T>, '', AnyParam>>
>;

export type ConstructPathArgs<T extends string> =
	PathParams<T> extends never ? [T] : [T, PathParams<T>];

export type IsActiveArgs<T extends string> =
	PathParams<T> extends never ? [T] : [T] | [T, PathParams<T>];

export type PathParams<T extends string> =
	ExtractParams<RemoveParenthesis<T>> extends never
		? never
		: Record<ExtractParams<RemoveParenthesis<T>>, string>;

export type AllParams<T extends Routes> = Partial<
	Record<ExtractParams<RemoveParenthesis<RecursiveKeys<T>>>, string>
>;

export type HooksContext = {
	pathname: string;
	replace?: boolean;
	search?: string;
	state?: string;
	hash?: string;
};

export type NavigateOptions =
	| {
			replace?: boolean;
			search?: string;
			state?: string;
			hash?: string;
			scrollToTop?: ScrollBehavior | false;
			viewTransition?: boolean;
	  }
	| undefined;

export type SearchParams = URLSearchParams & {
	append: (name: string, value: string, options?: { replace?: boolean }) => void;
	delete: (name: string, value?: string, options?: { replace?: boolean }) => void;
	set: (name: string, value: string, options?: { replace?: boolean }) => void;
	sort: (options?: { replace?: boolean }) => void;
};

type NavigateArgs<T extends string> =
	| (PathParams<T> extends never
			? [T] | [T, NavigateOptions]
			: [T, NavigateOptions & { params: PathParams<T> }])
	| [number];

type StripNonRoutes<T extends Routes> = {
	[K in keyof T as K extends `*${string}`
		? never
		: K extends `(*${string})`
			? never
			: K extends 'layout'
				? never
				: K extends 'hooks'
					? never
					: K extends 'meta'
						? never
						: K]: T[K] extends Routes ? StripNonRoutes<T[K]> : T[K];
};

type RecursiveKeys<
	T extends Routes,
	Prefix extends string = '',
	AnyParam extends boolean = false,
> = {
	[K in keyof T]: K extends string
		? T[K] extends Routes
			? RecursiveKeys<
					T[K],
					`${Prefix}${AnyParam extends true ? ReplaceParamWithString<K> : K}`,
					AnyParam
				>
			: `${Prefix}${AnyParam extends true ? ReplaceParamWithString<K> : K}`
		: never;
}[keyof T];

type ReplaceParamWithString<T extends string> = T extends `/:${string}`
	? `/${string}`
	: T extends `/(:${string})`
		? `/${string}`
		: T;

type RemoveLastSlash<T extends string> = T extends '/' ? T : T extends `${infer R}/` ? R : T;

type RemoveParenthesis<T extends string> = T extends `${infer A}(${infer B})${infer C}`
	? RemoveParenthesis<`${A}${B}${C}`>
	: T;

type ExtractParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
	? Param | ExtractParams<`/${Rest}`>
	: T extends `${string}:${infer Param}`
		? Param
		: T extends `${string}*${infer Param}`
			? Param extends ''
				? never
				: Param
			: never;
