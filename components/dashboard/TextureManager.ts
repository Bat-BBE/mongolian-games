import * as THREE from "three";

export class TextureManager {
  private textureCache = new Map<string, THREE.Texture>();
  private canvasCache = new Map<string, HTMLCanvasElement>();

  /**
   * Get or create a grass texture with procedural pattern
   */
  getGrassTexture(width = 512, height = 512): THREE.Texture {
    const key = `grass_${width}_${height}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    const grd = ctx.createLinearGradient(0, 0, width, height);
    grd.addColorStop(0, "#5a7a42");
    grd.addColorStop(0.45, "#6f8f52");
    grd.addColorStop(0.72, "#7a9858");
    grd.addColorStop(1, "#8faa6a");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    for (let pass = 0; pass < 3; pass++) {
      ctx.fillStyle = `rgba(${60 + pass * 25}, ${90 + pass * 15}, ${40 + pass * 10}, ${0.12 + pass * 0.06})`;
      for (let i = 0; i < width * height * 0.0018; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const w = Math.random() * 2.5 + 0.5;
        const h = Math.random() * 14 + 3;
        ctx.fillRect(x, y, w, h);
      }
    }

    ctx.strokeStyle = "rgba(45, 65, 28, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * width;
      ctx.beginPath();
      ctx.moveTo(x, Math.random() * height);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, Math.random() * height);
      ctx.stroke();
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 38;
      data[i] += noise;
      data[i + 1] += noise * 0.75;
      data[i + 2] += noise * 0.45;
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Get or create a stone/rock texture
   */
  getStoneTexture(width = 512, height = 512, variant = 0): THREE.Texture {
    const key = `stone_${width}_${height}_${variant}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Base gray
    const baseColors = ["#9a8f80", "#8a7a70", "#a09080"];
    ctx.fillStyle = baseColors[variant % baseColors.length];
    ctx.fillRect(0, 0, width, height);

    // Rock texture with cracks
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = Math.random() * 60 + 10;
      const h = Math.random() * 8 + 2;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.15})`;
      ctx.fillRect(x, y, w, h);
    }

    // Granular noise
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 40;
      data[i] += n;
      data[i + 1] += n;
      data[i + 2] += n;
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Get or create a soil/dirt texture
   */
  getSoilTexture(width = 512, height = 512): THREE.Texture {
    const key = `soil_${width}_${height}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Base brown/reddish soil
    ctx.fillStyle = "#7a6840";
    ctx.fillRect(0, 0, width, height);

    // Add rocky particles
    for (let i = 0; i < width * height * 0.01; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 1;
      ctx.fillStyle = `rgba(120, 110, 90, ${Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cracks and variation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 35;
      data[i] += n;
      data[i + 1] += n * 0.9;
      data[i + 2] += n * 0.8;
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Get or create a hide/fur texture for animals
   */
  getHideTexture(
    width = 256,
    height = 256,
    baseColor = 0xc8a060,
  ): THREE.Texture {
    const key = `hide_${width}_${height}_${baseColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Base color
    const r = (baseColor >> 16) & 0xff;
    const g = (baseColor >> 8) & 0xff;
    const b = baseColor & 0xff;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, width, height);

    // Add hair-like strokes
    ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 2) {
      for (let j = 0; j < width; j += Math.random() * 4 + 2) {
        ctx.beginPath();
        ctx.moveTo(j, i);
        ctx.lineTo(j + Math.random() * 4 - 2, i + Math.random() * 3);
        ctx.stroke();
      }
    }

    // Add variation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 20;
      data[i] += n;
      data[i + 1] += n;
      data[i + 2] += n;
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Get or create a wood texture (for trees, structures)
   */
  getWoodTexture(width = 256, height = 256): THREE.Texture {
    const key = `wood_${width}_${height}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Vertical grain pattern
    for (let x = 0; x < width; x++) {
      const grain =
        Math.sin(x * 0.1) * 0.5 +
        Math.sin(x * 0.03) * 0.3 +
        (Math.random() - 0.5) * 0.2;
      const color = Math.round(100 + (grain + 1) * 40);
      ctx.fillStyle = `rgb(${color * 0.7}, ${color * 0.6}, ${color * 0.4})`;
      ctx.fillRect(x, 0, 1, height);
    }

    // Add knots
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillStyle = "rgba(60, 40, 20, 0.3)";
      ctx.beginPath();
      ctx.ellipse(x, y, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Clear all cached textures
   */
  clear(): void {
    this.textureCache.forEach((texture) => texture.dispose());
    this.textureCache.clear();
    this.canvasCache.clear();
  }

  /**
   * Get texture cache stats
   */
  getStats(): { textureCount: number; cacheSize: string } {
    return {
      textureCount: this.textureCache.size,
      cacheSize: `${this.textureCache.size * 2}MB (approx)`,
    };
  }
}

// Export singleton instance
export const textureManager = new TextureManager();
