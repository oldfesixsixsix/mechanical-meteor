// Shared Three.js building blocks for the site-wide Continuous World (see
// CONTEXT.md's "Continuous World" glossary entry and
// docs/adr/0004-site-wide-continuous-world.md). Every page that renders the
// ice world builds its own independent Three.js instance from these
// functions rather than sharing a renderer across navigations — but they all
// pass the same ICE_WORLD_SEED/palette so it reads as one frozen lake seen
// from different camera positions, not a freshly randomized terrain per page.
//
// Ported (mechanical API rename only, not a visual change) from
// /demo/ice_terrain_3d.html and /demo/blog_list_3d.html.

import * as THREE from 'three';

export const ICE_WORLD_SEED = 771.3;

const PALETTE = {
	skyTop: 0x142338,
	skyBottom: 0x04070d,
	auroraA: 0x3ee6c4,
	auroraB: 0x8a7cf0,
	terrainDeep: 0x0b2032,
	terrainLight: 0xeaf7ff,
	terrainTeal: 0x3ee6c4,
	fog: 0x0a1522,
};

export function supportsWebGL(): boolean {
	try {
		const canvas = document.createElement('canvas');
		return !!(
			window.WebGLRenderingContext &&
			(canvas.getContext('webgl2') || canvas.getContext('webgl'))
		);
	} catch {
		return false;
	}
}

// ---------- seedable 2D Perlin noise ----------
export function makePerlin(seed: number): (x: number, y: number) => number {
	const perm = new Uint8Array(256);
	for (let i = 0; i < 256; i++) perm[i] = i;
	let s = seed || 1;
	function rand() {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	}
	for (let i = 255; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const t = perm[i];
		perm[i] = perm[j];
		perm[j] = t;
	}
	const p = new Uint8Array(512);
	for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
	function fade(t: number) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}
	function lerp(a: number, b: number, t: number) {
		return a + t * (b - a);
	}
	function grad(hash: number, x: number, y: number) {
		const h = hash & 7;
		const u = h < 4 ? x : y;
		const v = h < 4 ? y : x;
		return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
	}
	return function noise(x: number, y: number) {
		const X = Math.floor(x) & 255;
		const Y = Math.floor(y) & 255;
		x -= Math.floor(x);
		y -= Math.floor(y);
		const u = fade(x);
		const v = fade(y);
		const aa = p[p[X] + Y];
		const ab = p[p[X] + Y + 1];
		const ba = p[p[X + 1] + Y];
		const bb = p[p[X + 1] + Y + 1];
		return lerp(
			lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
			lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
			v,
		);
	};
}

// ---------- sky dome (aurora gradient shader) ----------
export function createSkyMesh(): THREE.Mesh {
	const geo = new THREE.SphereGeometry(80, 32, 32);
	const mat = new THREE.ShaderMaterial({
		uniforms: {
			time: { value: 0 },
			topColor: { value: new THREE.Color(PALETTE.skyTop) },
			bottomColor: { value: new THREE.Color(PALETTE.skyBottom) },
			auroraA: { value: new THREE.Color(PALETTE.auroraA) },
			auroraB: { value: new THREE.Color(PALETTE.auroraB) },
		},
		vertexShader: `
			varying vec3 vPos;
			void main() {
				vPos = position;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			varying vec3 vPos;
			uniform float time;
			uniform vec3 topColor, bottomColor, auroraA, auroraB;
			void main() {
				float h = normalize(vPos).y * 0.5 + 0.5;
				vec3 base = mix(bottomColor, topColor, h);
				float band = sin(vPos.x * 0.05 + time * 0.15) * 0.5 + 0.5;
				band *= smoothstep(0.15, 0.75, h) * smoothstep(1.0, 0.6, h);
				vec3 aurora = mix(auroraA, auroraB, sin(vPos.z * 0.04 + time * 0.1) * 0.5 + 0.5);
				vec3 color = base + aurora * band * 0.35;
				gl_FragColor = vec4(color, 1.0);
			}
		`,
		side: THREE.BackSide,
	});
	return new THREE.Mesh(geo, mat);
}

export function updateSkyMesh(skyMesh: THREE.Mesh, elapsed: number): void {
	const mat = skyMesh.material as THREE.ShaderMaterial;
	mat.uniforms.time.value = elapsed;
}

// ---------- environment map (for PBR reflections/transmission on the ice) ----------
export function createEnvMap(renderer: THREE.WebGLRenderer, size = 256): THREE.Texture {
	const envScene = new THREE.Scene();
	envScene.add(createSkyMesh());
	const dl = new THREE.DirectionalLight(0xcfe9f5, 1.4);
	dl.position.set(6, 10, 4);
	envScene.add(dl);
	envScene.add(new THREE.AmbientLight(0x2a3f52, 0.7));

	const cubeRT = new THREE.WebGLCubeRenderTarget(size, {
		format: THREE.RGBAFormat,
		generateMipmaps: true,
		minFilter: THREE.LinearMipmapLinearFilter,
	});
	const cubeCam = new THREE.CubeCamera(0.1, 100, cubeRT);
	envScene.add(cubeCam);
	cubeCam.update(renderer, envScene);
	return cubeRT.texture;
}

// ---------- procedural ice terrain ----------
export interface TerrainConfig {
	seed: number;
	size: number;
	segments: number;
	envMap: THREE.Texture;
}

export function createTerrain(config: TerrainConfig): THREE.Mesh {
	const { seed, size, segments, envMap } = config;
	const noise = makePerlin(seed);
	const geo = new THREE.PlaneGeometry(size, size, segments, segments);
	geo.rotateX(-Math.PI / 2);
	const pos = geo.attributes.position;
	const colors = new Float32Array(pos.count * 3);
	const cA = new THREE.Color(PALETTE.terrainDeep);
	const cB = new THREE.Color(PALETTE.terrainLight);
	const cTeal = new THREE.Color(PALETTE.terrainTeal);

	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const z = pos.getZ(i);
		let h = 0;
		let amp = 1;
		let freq = 0.045;
		let norm = 0;
		for (let o = 0; o < 5; o++) {
			h += noise(x * freq + seed, z * freq - seed) * amp;
			norm += amp;
			amp *= 0.5;
			freq *= 2;
		}
		h /= norm;
		const ridgeN = noise(x * 0.09 + seed * 2, z * 0.09 - seed * 2);
		const ridge = Math.pow(1 - Math.abs(ridgeN), 4);
		const height = h * 2.4 + ridge * 1.1;
		pos.setY(i, height);

		const t = THREE.MathUtils.clamp((height + 1.6) / 3.2, 0, 1);
		const c = cA.clone().lerp(cB, t);
		if (ridge > 0.5) c.lerp(cTeal, (ridge - 0.5) * 0.5);
		colors[i * 3] = c.r;
		colors[i * 3 + 1] = c.g;
		colors[i * 3 + 2] = c.b;
	}
	geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
	geo.computeVertexNormals();

	const mat = new THREE.MeshPhysicalMaterial({
		vertexColors: true,
		roughness: 0.3,
		metalness: 0.04,
		transmission: 0.5,
		thickness: 1.3,
		ior: 1.31,
		clearcoat: 0.6,
		clearcoatRoughness: 0.18,
		envMap,
		envMapIntensity: 1.25,
		side: THREE.DoubleSide,
	});

	return new THREE.Mesh(geo, mat);
}

// ---------- snow particle point cloud ----------
function createSnowTexture(): THREE.CanvasTexture {
	const c = document.createElement('canvas');
	c.width = c.height = 64;
	const ctx = c.getContext('2d')!;
	const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	g.addColorStop(0, 'rgba(255,255,255,1)');
	g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
	g.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 64, 64);
	return new THREE.CanvasTexture(c);
}

export interface SnowField {
	points: THREE.Points;
	velocities: Float32Array;
	phases: Float32Array;
	count: number;
	fallHeight: number;
}

export interface SnowConfig {
	count: number;
	size: number;
	fallHeight: number;
}

export function createSnowField(config: SnowConfig): SnowField {
	const { count, size, fallHeight } = config;
	const geo = new THREE.BufferGeometry();
	const positions = new Float32Array(count * 3);
	const velocities = new Float32Array(count);
	const phases = new Float32Array(count);

	for (let i = 0; i < count; i++) {
		positions[i * 3] = (Math.random() - 0.5) * size;
		positions[i * 3 + 1] = Math.random() * fallHeight;
		positions[i * 3 + 2] = (Math.random() - 0.5) * size;
		velocities[i] = 0.4 + Math.random() * 0.9;
		phases[i] = Math.random() * Math.PI * 2;
	}
	geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.16,
		map: createSnowTexture(),
		transparent: true,
		depthWrite: false,
		sizeAttenuation: true,
		opacity: 0.9,
		color: 0xffffff,
	});

	return {
		points: new THREE.Points(geo, mat),
		velocities,
		phases,
		count,
		fallHeight,
	};
}

export function updateSnowField(field: SnowField, dt: number, elapsed: number): void {
	const posAttr = field.points.geometry.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < field.count; i++) {
		let y = posAttr.array[i * 3 + 1] - field.velocities[i] * dt * 1.4;
		if (y < -1) y = field.fallHeight + Math.random() * 2;
		posAttr.array[i * 3 + 1] = y;
		posAttr.array[i * 3] += Math.sin(elapsed * 0.5 + field.phases[i]) * 0.003;
	}
	posAttr.needsUpdate = true;
}

// ---------- disposal ----------
export function disposeObject3D(root: THREE.Object3D): void {
	root.traverse((obj) => {
		const mesh = obj as THREE.Mesh;
		if (mesh.geometry) mesh.geometry.dispose();
		const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
		const materials = material ? (Array.isArray(material) ? material : [material]) : [];
		for (const mat of materials) {
			const withMap = mat as THREE.Material & { map?: THREE.Texture | null };
			if (withMap.map) withMap.map.dispose();
			mat.dispose();
		}
	});
}
