import * as THREE from "three";

/**
 * Advanced Texture Manager
 * Creates procedural PBR textures with normal maps, roughness, and detail
 * Photorealistic quality suitable for cinematic rendering
 */
export class AdvancedTextureManager {
  private diffuseCache = new Map<string, THREE.Texture>();
  private normalCache = new Map<string, THREE.Texture>();
  private roughnessCache = new Map<string, THREE.Texture>();
  private aoCache = new Map<string, THREE.Texture>();

  /**
   * Create high-quality horse fur texture with detail
   */
  getHorseFurDiffuse(baseColor = 0x8b6914): THREE.Texture {
    const key = `horse_fur_diffuse_${baseColor}`;
    if (this.diffuseCache.has(key)) {
      return this.diffuseCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    // Extract base color components
    const r = (baseColor >> 16) & 0xff;
    const g = (baseColor >> 8) & 0xff;
    const b = baseColor & 0xff;

    // Base coat
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 1024, 1024);

    // Hair-like texture with variations
    for (let i = 0; i < 50000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const length = Math.random() * 20 + 5;
      const angle = Math.random() * Math.PI;

      ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.08})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    // Subtle color variation
    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 25;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.8));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.6));
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this.diffuseCache.set(key, texture);
    return texture;
  }

  /**
   * Generate normal map for horse fur
   */
  getHorseFurNormal(): THREE.Texture {
    const key = "horse_fur_normal";
    if (this.normalCache.has(key)) {
      return this.normalCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Start with medium gray (neutral normal)
    ctx.fillStyle = "#8080ff";
    ctx.fillRect(0, 0, 512, 512);

    // Add directional hair strokes to normal map
    for (let y = 0; y < 512; y += 8) {
      for (let x = 0; x < 512; x += 8) {
        const angle = Math.sin(x * 0.05 + y * 0.03) * 3;
        const magnitude = Math.cos(y * 0.02) * 80 + 128;

        ctx.fillStyle = `rgb(128, ${Math.floor(magnitude)}, 200)`;
        ctx.fillRect(x, y, 8, 8);
      }
    }

    // Add fine detail
    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(
        100,
        Math.min(155, data[i] + (Math.random() - 0.5) * 20),
      );
      data[i + 1] = Math.max(
        100,
        Math.min(155, data[i + 1] + (Math.random() - 0.5) * 20),
      );
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    this.normalCache.set(key, texture);
    return texture;
  }

  /**
   * Generate roughness map for horse fur
   */
  getHorseFurRoughness(): THREE.Texture {
    const key = "horse_fur_roughness";
    if (this.roughnessCache.has(key)) {
      return this.roughnessCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base roughness (lighter = glossier in grayscale)
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, 512, 512);

    // Add variation - some areas more glossy (darker) from mane/tail oil
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 80 + 20;
      const darkness = Math.random() * 80 + 80;

      ctx.fillStyle = `rgba(${darkness}, ${darkness}, ${darkness}, 0.4)`;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, `rgba(${darkness}, ${darkness}, ${darkness}, 0.6)`);
      grad.addColorStop(1, `rgba(${darkness}, ${darkness}, ${darkness}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    this.roughnessCache.set(key, texture);
    return texture;
  }

  /**
   * High-quality camel fur texture
   */
  getCamelFurDiffuse(baseColor = 0xb8864a): THREE.Texture {
    const key = `camel_fur_diffuse_${baseColor}`;
    if (this.diffuseCache.has(key)) {
      return this.diffuseCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    const r = (baseColor >> 16) & 0xff;
    const g = (baseColor >> 8) & 0xff;
    const b = baseColor & 0xff;

    // Base with natural shading
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(
      0,
      `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`,
    );
    gradient.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
    gradient.addColorStop(
      1,
      `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`,
    );
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // Thick hair texture
    for (let i = 0; i < 80000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const length = Math.random() * 25 + 8;
      const angle = Math.random() * Math.PI;

      ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
      ctx.lineWidth = Math.random() * 2 + 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    // Darker patches for realistic variation
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        Math.random() * 150 + 50,
        Math.random() * 100 + 30,
        Math.random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this.diffuseCache.set(key, texture);
    return texture;
  }

  /**
   * Realistic stone/rock texture
   */
  getStoneDiffuse(variant = 0): THREE.Texture {
    const key = `stone_diffuse_${variant}`;
    if (this.diffuseCache.has(key)) {
      return this.diffuseCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    const baseColors = ["#9a8f80", "#8a7a70", "#a09080", "#7a6f60"];
    ctx.fillStyle = baseColors[variant % baseColors.length];
    ctx.fillRect(0, 0, 1024, 1024);

    // Add cracks and erosion patterns
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const width = Math.random() * 150 + 30;
      const height = Math.random() * 10 + 2;

      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2 + 0.1})`;
      ctx.fillRect(x, y, width, height);
    }

    // Rock texture detail
    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 50;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this.diffuseCache.set(key, texture);
    return texture;
  }

  /**
   * Stone normal map
   */
  getStoneNormal(): THREE.Texture {
    const key = "stone_normal";
    if (this.normalCache.has(key)) {
      return this.normalCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#8080ff";
    ctx.fillRect(0, 0, 512, 512);

    // Add crack normal detail
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const w = Math.random() * 100 + 30;

      ctx.strokeStyle = `rgba(100, 100, 180, 0.6)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.random() * w - w / 2,
        y + Math.random() * 50,
        x + Math.random() * w - w / 2,
        y + Math.random() * 100,
      );
      ctx.stroke();
    }

    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(
        50,
        Math.min(200, data[i] + (Math.random() - 0.5) * 60),
      );
      data[i + 1] = Math.max(
        50,
        Math.min(200, data[i + 1] + (Math.random() - 0.5) * 60),
      );
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    this.normalCache.set(key, texture);
    return texture;
  }

  /**
   * Professional grass/steppe texture
   */
  getGrassDiffuse(): THREE.Texture {
    const key = "grass_diffuse";
    if (this.diffuseCache.has(key)) {
      return this.diffuseCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base steppe grass colors
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#6a8c4a");
    gradient.addColorStop(0.5, "#5a7c3a");
    gradient.addColorStop(1, "#4a6c2a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    // Dense grass blades
    for (let i = 0; i < 100000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const height = Math.random() * 30 + 10;
      const width = Math.random() * 2 + 0.5;

      const brightness = Math.random() * 50 - 25;
      ctx.strokeStyle = `rgba(${100 + brightness}, ${120 + brightness}, ${60 + brightness}, ${Math.random() * 0.5 + 0.3})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y - height);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this.diffuseCache.set(key, texture);
    return texture;
  }

  /**
   * Clear all cached textures
   */
  clear(): void {
    this.diffuseCache.forEach((t) => t.dispose());
    this.normalCache.forEach((t) => t.dispose());
    this.roughnessCache.forEach((t) => t.dispose());
    this.aoCache.forEach((t) => t.dispose());
    this.diffuseCache.clear();
    this.normalCache.clear();
    this.roughnessCache.clear();
    this.aoCache.clear();
  }

  /**
   * Get memory stats
   */
  getStats() {
    return {
      diffuseCount: this.diffuseCache.size,
      normalCount: this.normalCache.size,
      roughnessCount: this.roughnessCache.size,
      totalTextures:
        this.diffuseCache.size +
        this.normalCache.size +
        this.roughnessCache.size,
    };
  }
}

export const advancedTextureManager = new AdvancedTextureManager();
