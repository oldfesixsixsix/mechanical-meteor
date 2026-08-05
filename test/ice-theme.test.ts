import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

// astro:assets' <Image> can't resolve a content-collection image field outside
// the real build pipeline (a Container API limitation, not a zone-marker
// concern) — stub getCollection with fixture posts that carry no heroImage so
// the blog index test is hermetic and doesn't depend on today's editorial
// content having (or not having) hero images.
vi.mock('astro:content', () => ({
	getCollection: async () => [
		{
			id: 'fixture-post',
			data: {
				title: 'Fixture Post',
				pubDate: new Date('2026-01-01'),
				draft: false,
				tags: ['astro'],
			},
		},
	],
}));

import BlogPost from '../src/layouts/BlogPost.astro';
import BaseHead from '../src/components/BaseHead.astro';
import Footer from '../src/components/Footer.astro';
import Header from '../src/components/Header.astro';
import BlogIndex from '../src/pages/blog/index.astro';
import Homepage from '../src/pages/index.astro';
import TagPage from '../src/pages/tags/[tag].astro';

const ICE_DECORATIVE_MARKUP = /class="[^"]*\b(glacier|aurora|snow-layer|icicle|crack-field|cold-light)\b/;
const JUNGLE_VOCAB = /jungle|canopy|\bvine\b|\bleaf\b|light-pool|threshold-exit|threshold-enter/i;

async function render(
	component: Parameters<AstroContainer['renderToString']>[0],
	options: Record<string, unknown> = {},
) {
	const container = await AstroContainer.create({
		astroConfig: { site: 'https://mechanical-meteor-six.vercel.app' },
	});
	return container.renderToString(component, {
		request: new Request('https://mechanical-meteor-six.vercel.app/'),
		...options,
	});
}

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = `${dir}/${name}`;
		return statSync(full).isDirectory() ? walk(full) : [full];
	});
}

describe('Immersive Zone (homepage)', () => {
	it('marks the page root as the immersive zone', async () => {
		const html = await render(Homepage);
		expect(html).toMatch(/<body[^>]*data-zone="immersive"/);
	});

	it('renders ice-theme decorative artwork', async () => {
		const html = await render(Homepage);
		expect(html).toMatch(ICE_DECORATIVE_MARKUP);
	});

	it('hides decorative artwork from assistive tech', async () => {
		const html = await render(Homepage);
		expect(html).toMatch(/class="ice-scene" aria-hidden="true"/);
	});

	it('preserves the existing hero copy and CTA links', async () => {
		const html = await render(Homepage);
		expect(html).toContain('走到對岸');
		expect(html).toContain('給他20元打車');
	});

	it('gates the entrance animation with a session-storage read, not a JS animation engine', async () => {
		const html = await render(Homepage);
		expect(html).toMatch(/sessionStorage\.getItem\('ice-entrance-played'\)/);
	});
});

describe('Reading Zone pages', () => {
	it('marks the blog index as the reading zone with no decoration', async () => {
		const html = await render(BlogIndex);
		expect(html).toMatch(/<body[^>]*data-zone="reading"/);
		expect(html).not.toMatch(ICE_DECORATIVE_MARKUP);
	});

	// Scoped <style> content isn't surfaced by Container API's renderToString
	// (same class of limitation as the astro:assets Image issue above), so the
	// structural card-edge exception is checked against the source file rather
	// than rendered HTML.
	it('applies the card-edge clip-path structural exception only to the blog index', () => {
		const blogIndexSrc = readFileSync(
			fileURLToPath(new URL('../src/pages/blog/index.astro', import.meta.url)),
			'utf-8',
		);
		expect(blogIndexSrc).toMatch(/clip-path/);
	});

	it('does not apply the card-edge exception to pages with no card grid', () => {
		const tagPageSrc = readFileSync(
			fileURLToPath(new URL('../src/pages/tags/[tag].astro', import.meta.url)),
			'utf-8',
		);
		const blogPostSrc = readFileSync(
			fileURLToPath(new URL('../src/layouts/BlogPost.astro', import.meta.url)),
			'utf-8',
		);
		expect(tagPageSrc).not.toMatch(/clip-path/);
		expect(blogPostSrc).not.toMatch(/clip-path/);
	});

	it('marks a tag page as the reading zone with no decoration', async () => {
		const html = await render(TagPage, {
			params: { tag: 'astro' },
			props: { posts: [] },
		});
		expect(html).toMatch(/<body[^>]*data-zone="reading"/);
		expect(html).not.toMatch(ICE_DECORATIVE_MARKUP);
	});

	it('marks BlogPost-layout pages (posts and about) as the reading zone with no decoration', async () => {
		const html = await render(BlogPost, {
			props: {
				id: 'test-post',
				title: 'Test Post',
				description: 'A test post',
				pubDate: new Date('2026-01-01'),
			},
			slots: { default: '<p>Body copy</p>' },
		});
		expect(html).toMatch(/<body[^>]*data-zone="reading"/);
		expect(html).not.toMatch(ICE_DECORATIVE_MARKUP);
	});
});

describe('Shared chrome (Header/Footer)', () => {
	it('renders the Header without decorative ice artwork', async () => {
		const html = await render(Header);
		expect(html).not.toMatch(ICE_DECORATIVE_MARKUP);
	});

	it('renders the Footer without decorative ice artwork', async () => {
		const html = await render(Footer);
		expect(html).not.toMatch(ICE_DECORATIVE_MARKUP);
	});

	it('still renders no theme toggle', async () => {
		const html = await render(Header);
		expect(html).not.toMatch(/theme-toggle/i);
	});
});

describe('Theme system', () => {
	it('the ThemeToggle component file still does not exist', () => {
		const path = fileURLToPath(new URL('../src/components/ThemeToggle.astro', import.meta.url));
		expect(existsSync(path)).toBe(false);
	});

	it('BaseHead still has no no-FOUC theme script', async () => {
		const html = await render(BaseHead, {
			props: { title: 'Test', description: 'Test' },
		});
		expect(html).not.toMatch(/localStorage.getItem\('theme'\)/);
	});

	it('still enables site-wide client-side routing via ClientRouter', async () => {
		const html = await render(BaseHead, {
			props: { title: 'Test', description: 'Test' },
		});
		expect(html).toMatch(/name="astro-view-transitions-enabled"/);
	});
});

describe('Jungle-theme regression guard', () => {
	it('leaves no jungle vocabulary anywhere under src/', () => {
		const srcDir = fileURLToPath(new URL('../src', import.meta.url));
		const offenders = walk(srcDir)
			.filter((file) => /\.(astro|css|ts)$/.test(file))
			.flatMap((file) => {
				const content = readFileSync(file, 'utf-8');
				return JUNGLE_VOCAB.test(content) ? [file] : [];
			});
		expect(offenders).toEqual([]);
	});
});
