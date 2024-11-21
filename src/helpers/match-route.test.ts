import type { Component } from 'svelte';
import type { Routes } from '../types';
import { matchRoute } from './match-route';

const Home = (() => 'Home') as Component;
const Posts = (() => 'Posts') as Component;
const StaticPost = (() => 'StaticPost') as Component;
const DynamicPost = (() => 'DynamicPost') as Component;
const DynamicPostComment = (() => 'DynamicPostComment') as Component;
const UserNotFound = (() => 'UserNotFound') as Component;
const PageNotFound = (() => 'PageNotFound') as Component;

describe('matchRoute', () => {
	describe.each([
		{
			mode: 'inline',
			routes: {
				'/': Home,
				'/posts': Posts,
				'/posts/foo': StaticPost,
				'/posts/:id': DynamicPost,
				'/posts/:id/:commentId': DynamicPostComment,
				'/users/*': UserNotFound,
				'*': PageNotFound,
			} satisfies Routes,
		},
		{
			mode: 'nested',
			routes: {
				'/': Home,
				'/posts': {
					'/': Posts,
					'/foo': StaticPost,
					'/:id': {
						'/': DynamicPost,
						'/:commentId': DynamicPostComment,
					},
				},
				'/users/*': UserNotFound,
				'*': PageNotFound,
			} satisfies Routes,
		},
	])('$mode paths', ({ routes: r }) => {
		const routes = r as Routes;

		it('should match the root route', () => {
			const { match } = matchRoute('/', routes);
			expect(match).toEqual(Home);
		});

		it('should match a simple route', () => {
			const { match } = matchRoute('/posts', routes);
			expect(match).toEqual(Posts);
		});

		it('should match a nested route', () => {
			const { match } = matchRoute('/posts/foo', routes);
			expect(match).toEqual(StaticPost);
		});

		it('should match a dynamic route and return a param', () => {
			const { match, params } = matchRoute('/posts/bar', routes);
			expect(match).toEqual(DynamicPost);
			expect(params).toEqual({ id: 'bar' });
		});

		it('should match multiple dynamic nested routes and return params', () => {
			const { match, params } = matchRoute('/posts/bar/buzz', routes);
			expect(match).toEqual(DynamicPostComment);
			expect(params).toEqual({ id: 'bar', commentId: 'buzz' });
		});

		it('should match wildcard nested route', () => {
			const { match } = matchRoute('/users/notfound', routes);
			expect(match).toEqual(UserNotFound);
		});

		it('should match wildcard route', () => {
			const { match } = matchRoute('/notfound', routes);
			expect(match).toEqual(PageNotFound);
		});

		it('should not match any route', () => {
			delete routes['*'];
			const { match } = matchRoute('/notfound', routes);
			expect(match).toBeUndefined();
		});
	});
});
