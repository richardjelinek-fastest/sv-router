import {
	buildFileTree,
	createRouteMap,
	createRouterCode,
	generateRouterCode,
	pathToCorrectCasing,
} from '../src/gen/generate-router-code.js';

const readdirSync = vi.hoisted(() => vi.fn());
const lstatSync = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({ default: { readdirSync, lstatSync, existsSync: () => true } }));

describe('generateRouterCode', () => {
	it('should generate the router code (flat)', () => {
		mockFlatMode();
		const result = generateRouterCode('./a/fake/path');
		expect(result).toBe(`import { createRouter } from 'sv-router';
import About from '../a/fake/path/about.svelte';
import Index from '../a/fake/path/index.svelte';
import PostsStatic from '../a/fake/path/posts.static.svelte';
import PostsNolayout from '../a/fake/path/posts.(nolayout).svelte';

const routes = Object.freeze({
  '*notfound': () => import('../a/fake/path/[...notfound].lazy.svelte'),
  '/about': About,
  '/': Index,
  '/posts/:id': () => import('../a/fake/path/posts.[id].lazy.svelte'),
  '/posts': () => import('../a/fake/path/posts.index.lazy.svelte'),
  '/posts/static': PostsStatic,
  '/posts/(nolayout)': PostsNolayout,
  '/posts/comments/:id': () => import('../a/fake/path/posts.comments.[id].lazy.svelte')
} as const);
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, route } = createRouter(routes);`);
	});

	it('should generate the router code (tree)', () => {
		mockTreeMode();
		const result = generateRouterCode('./a/fake/path');
		expect(result).toBe(`import { createRouter } from 'sv-router';
import About from '../a/fake/path/about.svelte';
import Index from '../a/fake/path/index.svelte';
import PostsLayout from '../a/fake/path/posts/layout.svelte';
import PostsStatic from '../a/fake/path/posts/static.svelte';
import PostsNolayout from '../a/fake/path/posts/(nolayout).svelte';
import postsHooks from '../a/fake/path/posts/hooks';
import postsMeta from '../a/fake/path/posts/meta.svelte';
import postsCommentsHooks from '../a/fake/path/posts/comments/hooks.svelte';
import postsCommentsMeta from '../a/fake/path/posts/comments/meta';

const routes = Object.freeze({
  '*notfound': () => import('../a/fake/path/[...notfound].lazy.svelte'),
  '/about': About,
  '/': Index,
  '/posts': {
    '/:id': () => import('../a/fake/path/posts/[id].lazy.svelte'),
    'layout': PostsLayout,
    '/': () => import('../a/fake/path/posts/index.lazy.svelte'),
    '/static': PostsStatic,
    '/(nolayout)': PostsNolayout,
    'hooks': postsHooks,
    'meta': postsMeta,
    '/comments': {
      '/:id': () => import('../a/fake/path/posts/comments/[id].lazy.svelte'),
      'hooks': postsCommentsHooks,
      'meta': postsCommentsMeta
    }
  }
} as const);
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, route } = createRouter(routes);`);
	});
});

describe('buildFileTree', () => {
	it('should get the file tree (flat)', () => {
		mockFlatMode();
		const result = buildFileTree('a/fake/path');
		expect(result).toEqual([
			'[...notfound].lazy.svelte',
			'about.svelte',
			'index.svelte',
			'posts.[id].lazy.svelte',
			'posts.index.lazy.svelte',
			'posts.static.svelte',
			'posts.(nolayout).svelte',
			'posts.comments.[id].lazy.svelte',
		]);
	});

	it('should get the file tree (tree)', () => {
		mockTreeMode();
		const result = buildFileTree('a/fake/path');
		expect(result).toEqual([
			'[...notfound].lazy.svelte',
			'about.svelte',
			'index.svelte',
			{
				name: 'posts',
				tree: [
					'[id].lazy.svelte',
					'layout.svelte',
					'index.lazy.svelte',
					'static.svelte',
					'(nolayout).svelte',
					'hooks.ts',
					'meta.svelte.ts',
					{
						name: 'comments',
						tree: ['[id].lazy.svelte', 'hooks.svelte.ts', 'meta.ts'],
					},
				],
			},
		]);
	});
});

describe('createRouteMap', () => {
	it('should generate routes (flat)', () => {
		const result = createRouteMap([
			'[...notfound].lazy.svelte',
			'about.svelte',
			'index.svelte',
			'posts.[id].svelte',
			'posts.index.lazy.svelte',
			'posts.static.svelte',
			'posts.(nolayout).svelte',
			'posts.([nolayoutparam]).svelte',
			'posts.comments.[id].lazy.svelte',
			'posts.comments.([...notfound]).svelte',
			'posts.meta.ts',
		]);
		expect(result).toEqual({
			'*notfound': '[...notfound].lazy.svelte',
			'/': 'index.svelte',
			'/about': 'about.svelte',
			'/posts/:id': 'posts.[id].svelte',
			'/posts': 'posts.index.lazy.svelte',
			'/posts/static': 'posts.static.svelte',
			'/posts/(nolayout)': 'posts.(nolayout).svelte',
			'/posts/(:nolayoutparam)': 'posts.([nolayoutparam]).svelte',
			'/posts/comments/:id': 'posts.comments.[id].lazy.svelte',
			'/posts/comments/(*notfound)': 'posts.comments.([...notfound]).svelte',
			meta: 'posts.meta.ts',
		});
	});

	it('should generate routes (tree)', () => {
		const result = createRouteMap([
			'index.svelte',
			'about.svelte',
			{
				name: 'posts',
				tree: [
					'index.lazy.svelte',
					'static.svelte',
					'(nolayout).svelte',
					'[id].svelte',
					'([nolayoutparam]).svelte',
					'layout.svelte',
					'hooks.ts',
					'meta.svelte.ts',
					{
						name: 'comments',
						tree: ['[id].lazy.svelte', '([...notfound]).svelte', 'hooks.svelte.ts', 'meta.ts'],
					},
				],
			},
			'[...notfound].lazy.svelte',
		]);
		expect(result).toEqual({
			'/': 'index.svelte',
			'/about': 'about.svelte',
			'/posts': {
				'/': 'posts/index.lazy.svelte',
				'/static': 'posts/static.svelte',
				'/(nolayout)': 'posts/(nolayout).svelte',
				'/:id': 'posts/[id].svelte',
				'/(:nolayoutparam)': 'posts/([nolayoutparam]).svelte',
				layout: 'posts/layout.svelte',
				hooks: 'posts/hooks.ts',
				meta: 'posts/meta.svelte.ts',
				'/comments': {
					'/:id': 'posts/comments/[id].lazy.svelte',
					'(*notfound)': 'posts/comments/([...notfound]).svelte',
					hooks: 'posts/comments/hooks.svelte.ts',
					meta: 'posts/comments/meta.ts',
				},
			},
			'*notfound': '[...notfound].lazy.svelte',
		});
	});

	it('should generate dynamic folder route (tree)', () => {
		const result = createRouteMap([
			'index.svelte',
			{
				name: '[slug]',
				tree: ['index.svelte', 'meta.ts'],
			},
		]);
		expect(result).toEqual({
			'/': 'index.svelte',
			'/:slug': {
				'/': '[slug]/index.svelte',
				meta: '[slug]/meta.ts',
			},
		});
	});
});

describe('createRouterCode', () => {
	const routes = {
		'/': 'index.svelte',
		'/about': 'about.svelte',
		'/posts': {
			'/': 'posts/index.lazy.svelte',
			'/static': 'posts/static.svelte',
			'/(nolayout)': 'posts/(nolayout).svelte',
			'/:id': 'posts/[id].lazy.svelte',
			hooks: 'posts/hooks.ts',
			meta: 'posts/meta.ts',
			'/comments': {
				'/:commentId': 'posts/comments/[commentId].svelte',
				hooks: 'posts/comments/hooks.svelte.ts',
				meta: 'posts/comments/meta.svelte.ts',
			},
		},
		'*notfound': '[...notfound].lazy.svelte',
	};

	it('should generate the router', () => {
		const result = createRouterCode(routes, './routes');
		expect(result).toBe(`import { createRouter } from 'sv-router';
import Index from './routes/index.svelte';
import About from './routes/about.svelte';
import PostsStatic from './routes/posts/static.svelte';
import PostsNolayout from './routes/posts/(nolayout).svelte';
import postsHooks from './routes/posts/hooks';
import postsMeta from './routes/posts/meta';
import PostsCommentsCommentId from './routes/posts/comments/[commentId].svelte';
import postsCommentsHooks from './routes/posts/comments/hooks.svelte';
import postsCommentsMeta from './routes/posts/comments/meta.svelte';

const routes = Object.freeze({
  '/': Index,
  '/about': About,
  '/posts': {
    '/': () => import('./routes/posts/index.lazy.svelte'),
    '/static': PostsStatic,
    '/(nolayout)': PostsNolayout,
    '/:id': () => import('./routes/posts/[id].lazy.svelte'),
    'hooks': postsHooks,
    'meta': postsMeta,
    '/comments': {
      '/:commentId': PostsCommentsCommentId,
      'hooks': postsCommentsHooks,
      'meta': postsCommentsMeta
    }
  },
  '*notfound': () => import('./routes/[...notfound].lazy.svelte')
} as const);
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, route } = createRouter(routes);`);
	});

	it('should generate the router code with only lazy routes', () => {
		const result = createRouterCode(routes, './routes', { allLazy: true });
		expect(result).toBe(`import { createRouter } from 'sv-router';
import postsHooks from './routes/posts/hooks';
import postsMeta from './routes/posts/meta';
import postsCommentsHooks from './routes/posts/comments/hooks.svelte';
import postsCommentsMeta from './routes/posts/comments/meta.svelte';

const routes = Object.freeze({
  '/': () => import('./routes/index.svelte'),
  '/about': () => import('./routes/about.svelte'),
  '/posts': {
    '/': () => import('./routes/posts/index.lazy.svelte'),
    '/static': () => import('./routes/posts/static.svelte'),
    '/(nolayout)': () => import('./routes/posts/(nolayout).svelte'),
    '/:id': () => import('./routes/posts/[id].lazy.svelte'),
    'hooks': postsHooks,
    'meta': postsMeta,
    '/comments': {
      '/:commentId': () => import('./routes/posts/comments/[commentId].svelte'),
      'hooks': postsCommentsHooks,
      'meta': postsCommentsMeta
    }
  },
  '*notfound': () => import('./routes/[...notfound].lazy.svelte')
} as const);
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, route } = createRouter(routes);`);
	});
});

describe('pathToCorrectCasing', () => {
	it('should handle paths with only one segment', () => {
		const result = pathToCorrectCasing('about.svelte');
		expect(result).toBe('About');
	});

	it('should convert a path with multiple segments to camelCase', () => {
		const result = pathToCorrectCasing('simple/path/about.svelte');
		expect(result).toBe('SimplePathAbout');
	});

	it('should handle paths with dashes correctly', () => {
		const result = pathToCorrectCasing('this-is/a-test/path/about-me.svelte');
		expect(result).toBe('ThisIsATestPathAboutMe');
	});

	it('should handle lazy paths correctly', () => {
		const result = pathToCorrectCasing('posts/about.lazy.svelte');
		expect(result).toBe('PostsAbout');
	});

	it('should handle paths with a param correctly', () => {
		const result = pathToCorrectCasing('posts/[id].svelte');
		expect(result).toBe('PostsId');
	});

	it('should handle paths with a param in a folder correctly', () => {
		const result = pathToCorrectCasing('posts/[id]/index.svelte');
		expect(result).toBe('PostsIdIndex');
	});

	it('should handle catch-all paths correctly', () => {
		const result = pathToCorrectCasing('posts/[...notfound].svelte');
		expect(result).toBe('PostsNotfound');
	});

	it('should handle paths with no layout', () => {
		const result = pathToCorrectCasing('posts/(nolayout).svelte');
		expect(result).toBe('PostsNolayout');
	});

	it('should handle paths with hooks', () => {
		const result = pathToCorrectCasing('posts/hooks.svelte.ts');
		expect(result).toBe('postsHooks');
	});

	it('should handle paths with meta', () => {
		const result = pathToCorrectCasing('posts/meta.svelte.ts');
		expect(result).toBe('postsMeta');
	});

	it('should handle flat paths', () => {
		const result1 = pathToCorrectCasing('simple.path.about.svelte');
		expect(result1).toBe('SimplePathAbout');

		const result2 = pathToCorrectCasing('posts.[...notfound].svelte');
		expect(result2).toBe('PostsNotfound');

		const result3 = pathToCorrectCasing('posts.[...notfound].svelte');
		expect(result3).toBe('PostsNotfound');

		const result4 = pathToCorrectCasing('posts.hooks.ts');
		expect(result4).toBe('postsHooks');

		const result5 = pathToCorrectCasing('posts.meta.ts');
		expect(result5).toBe('postsMeta');
	});
});

function mockFlatMode() {
	readdirSync.mockImplementation(() => [
		'[...notfound].lazy.svelte',
		'about.svelte',
		'index.svelte',
		'posts.[id].lazy.svelte',
		'posts.index.lazy.svelte',
		'posts.static.svelte',
		'posts.(nolayout).svelte',
		'posts.text.txt',
		'posts.noextension',
		'posts.comments.[id].lazy.svelte',
	]);
	lstatSync.mockImplementation(() => ({
		isDirectory: () => false,
	}));
}

function mockTreeMode() {
	readdirSync.mockImplementation((dir) => {
		if (dir.toString().endsWith('posts')) {
			return [
				'[id].lazy.svelte',
				'layout.svelte',
				'index.lazy.svelte',
				'static.svelte',
				'(nolayout).svelte',
				'hooks.ts',
				'meta.svelte.ts',
				'text.txt',
				'noextension',
				'comments',
			];
		}
		if (dir.toString().endsWith('comments')) {
			return ['[id].lazy.svelte', 'hooks.svelte.ts', 'meta.ts'];
		}
		return ['[...notfound].lazy.svelte', 'about.svelte', 'index.svelte', 'posts'];
	});
	lstatSync.mockImplementation((dir) => ({
		isDirectory() {
			return dir.toString().endsWith('posts') || dir.toString().endsWith('comments');
		},
	}));
}
