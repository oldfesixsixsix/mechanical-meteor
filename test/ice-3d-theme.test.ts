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

// Vocabulary from theme generations this project has moved past — none of it
// should resurface. See CONTEXT.md's Decisions Log.
const RETIRED_VOCAB =
	/jungle|canopy|\bvine\b|\bleaf\b|light-pool|threshold-exit|threshold-enter|threshold-shatter|\bice-scene\b|\bglacier\b|snow-layer|\bicicle\b|crack-field|cold-light|view-transition-old\(root\)|view-transition-new\(root\)/i;

function srcFile(relativePath: string) {
	return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), 'utf-8');
}

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = `${dir}/${name}`;
		return statSync(full).isDirectory() ? walk(full) : [full];
	});
}

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

	it('server-renders the static fallback content with no <canvas> (that only appears once client JS mounts one)', async () => {
		const html = await render(Homepage);
		expect(html).toContain('Fixture Post'); // latest-post card, from real content collection data
		expect(html).not.toMatch(/<canvas/);
	});

	it('carries the WebGL scene as a normal bundled module script (no raw ESM import in an inline script)', () => {
		const src = srcFile('src/pages/index.astro');
		const scriptTags = [...src.matchAll(/<script([^>]*)>/g)];
		expect(scriptTags.length).toBeGreaterThan(0);
		for (const [, attrs] of scriptTags) {
			if (/data-astro-rerun/.test(attrs)) {
				// The re-run trigger must NOT contain import statements — Astro
				// re-injects data-astro-rerun scripts as literal inline text, which
				// breaks on `import`. It should just call the exposed entry point.
				const start = src.indexOf(`<script${attrs}>`);
				const end = src.indexOf('</script>', start);
				const body = src.slice(start, end);
				expect(body).not.toMatch(/^\s*import /m);
			}
		}
	});

	it('exposes a re-run trigger that reinitializes the scene on every real return to the homepage', () => {
		const src = srcFile('src/pages/index.astro');
		expect(src).toMatch(/<script data-astro-rerun>/);
		expect(src).toMatch(/window\.__initIceScene/);
	});

	it('disposes WebGL resources on astro:before-swap', () => {
		const src = srcFile('src/pages/index.astro');
		expect(src).toMatch(/astro:before-swap/);
		expect(src).toMatch(/renderer\.dispose\(\)/);
	});
});

describe('Reading Zone pages', () => {
	it('marks the blog index as the reading zone with no retired decoration', async () => {
		const html = await render(BlogIndex);
		expect(html).toMatch(/<body[^>]*data-zone="reading"/);
		expect(html).not.toMatch(RETIRED_VOCAB);
	});

	it('marks a tag page as the reading zone', async () => {
		const html = await render(TagPage, {
			params: { tag: 'astro' },
			props: { posts: [] },
		});
		expect(html).toMatch(/<body[^>]*data-zone="reading"/);
	});

	it('marks BlogPost-layout pages (posts and about) as the reading zone', async () => {
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
	});

	// Scoped <style> content isn't surfaced by Container API's renderToString,
	// so the card-edge exception is checked against the source file.
	it('keeps the card-edge clip-path structural exception scoped to the blog index only', () => {
		expect(srcFile('src/pages/blog/index.astro')).toMatch(/clip-path/);
		expect(srcFile('src/pages/tags/[tag].astro')).not.toMatch(/clip-path/);
		expect(srcFile('src/layouts/BlogPost.astro')).not.toMatch(/clip-path/);
	});
});

describe('Threshold Transition: shared, persisted whiteout', () => {
	it('ThresholdWhiteout.astro uses transition:persist', () => {
		expect(srcFile('src/components/ThresholdWhiteout.astro')).toMatch(/transition:persist/);
	});

	it('is imported and rendered on every top-level page/layout', () => {
		for (const path of [
			'src/pages/index.astro',
			'src/pages/blog/index.astro',
			'src/pages/tags/[tag].astro',
			'src/layouts/BlogPost.astro',
		]) {
			const src = srcFile(path);
			expect(src).toMatch(/import ThresholdWhiteout/);
			expect(src).toMatch(/<ThresholdWhiteout\s*\/>/);
		}
	});
});

describe('Shared chrome (Header/Footer)', () => {
	it('renders without any retired-theme vocabulary', async () => {
		expect(await render(Header)).not.toMatch(RETIRED_VOCAB);
		expect(await render(Footer)).not.toMatch(RETIRED_VOCAB);
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
		const html = await render(BaseHead, { props: { title: 'Test', description: 'Test' } });
		expect(html).not.toMatch(/localStorage.getItem\('theme'\)/);
	});

	it('still enables site-wide client-side routing via ClientRouter', async () => {
		const html = await render(BaseHead, { props: { title: 'Test', description: 'Test' } });
		expect(html).toMatch(/name="astro-view-transitions-enabled"/);
	});
});

describe('Font provider', () => {
	it('astro.config.mjs loads Noto Serif TC via fontProviders.google()', () => {
		const config = srcFile('astro.config.mjs');
		expect(config).toMatch(/fontProviders\.google\(\)/);
		expect(config).toMatch(/Noto Serif TC/);
	});
});

describe('Three.js scoping', () => {
	it('never appears outside src/pages/index.astro', () => {
		const srcDir = fileURLToPath(new URL('../src', import.meta.url));
		const offenders = walk(srcDir)
			.filter((file) => /\.(astro|css|ts)$/.test(file))
			.filter((file) => !file.endsWith('/src/pages/index.astro'))
			.flatMap((file) => {
				const content = readFileSync(file, 'utf-8');
				return /\bthree\b|\bTHREE\b/.test(content) ? [file] : [];
			});
		expect(offenders).toEqual([]);
	});

	it('index.astro imports three as an npm package, not a CDN <script src>', () => {
		const src = srcFile('src/pages/index.astro');
		expect(src).toMatch(/import \* as THREE from 'three'/);
		expect(src).not.toMatch(/cdnjs\.cloudflare\.com/);
	});

	it('package.json depends on three', () => {
		const pkg = JSON.parse(srcFile('package.json'));
		expect(pkg.dependencies.three).toBeDefined();
	});
});

describe('Retired-theme regression guard', () => {
	it('leaves no jungle- or CSS-ice-hero-era vocabulary anywhere under src/', () => {
		const srcDir = fileURLToPath(new URL('../src', import.meta.url));
		const offenders = walk(srcDir)
			.filter((file) => /\.(astro|css|ts)$/.test(file))
			.flatMap((file) => {
				const content = readFileSync(file, 'utf-8');
				return RETIRED_VOCAB.test(content) ? [file] : [];
			});
		expect(offenders).toEqual([]);
	});
});
