import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { existsSync } from 'node:fs';
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

const DECORATIVE_MARKUP = /class="[^"]*\b(canopy|leaf|vine|light-pool)\b/;

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

describe('Immersive Zone (homepage)', () => {
	it('marks the page root as the immersive zone', async () => {
		const html = await render(Homepage);
		expect(html).toMatch(/<body[^>]*data-zone="immersive"/);
	});

	it('renders decorative jungle artwork', async () => {
		const html = await render(Homepage);
		expect(html).toMatch(DECORATIVE_MARKUP);
	});

	it('hides decorative artwork from assistive tech', async () => {
		const html = await render(Homepage);
		expect(html).toMatch(/class="canopy" aria-hidden="true"/);
	});
});

describe('Reading Zone pages', () => {
	it('marks the blog index as the reading zone with no decoration', async () => {
		const html = await render(BlogIndex);
		expect(html).toMatch(/<body[^>]*data-zone="reading"/);
		expect(html).not.toMatch(DECORATIVE_MARKUP);
	});

	it('marks a tag page as the reading zone with no decoration', async () => {
		const html = await render(TagPage, {
			params: { tag: 'astro' },
			props: { posts: [] },
		});
		expect(html).toMatch(/<body[^>]*data-zone="reading"/);
		expect(html).not.toMatch(DECORATIVE_MARKUP);
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
		expect(html).not.toMatch(DECORATIVE_MARKUP);
	});
});

describe('Shared chrome (Header/Footer)', () => {
	it('renders the Header without decorative jungle artwork', async () => {
		const html = await render(Header);
		expect(html).not.toMatch(DECORATIVE_MARKUP);
	});

	it('renders the Footer without decorative jungle artwork', async () => {
		const html = await render(Footer);
		expect(html).not.toMatch(DECORATIVE_MARKUP);
	});

	it('no longer renders a theme toggle', async () => {
		const html = await render(Header);
		expect(html).not.toMatch(/theme-toggle/i);
	});
});

describe('Theme toggle removal (ADR-0001)', () => {
	it('deletes the ThemeToggle component file', () => {
		const path = fileURLToPath(new URL('../src/components/ThemeToggle.astro', import.meta.url));
		expect(existsSync(path)).toBe(false);
	});

	it('removes the no-FOUC theme script from BaseHead', async () => {
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
