// ============================================
// Vanilla Graph — ESM module (no deps)
//
// Exports:
//   - GraphEngine: Core physics and data engine
//   - Renderer2D: Canvas 2D renderer
//   - Renderer3D: Three.js 3D renderer
//   - VanillaGraph: Main component class
//   - createVanillaGraph: Factory function
// ============================================

// ============================================
// Utilities
// ============================================

// --- Math ---
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist2 = (ax, ay, bx, by) => {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
};
const rand = (min, max) => min + Math.random() * (max - min);

// --- Color & Style ---
const PALETTE = [220, 265, 195, 15, 330, 160, 285, 45];

function colorForGroup(g, theme) {
    if (!g || typeof g !== 'string') {
        g = '(unknown)';
    }
    const i = Math.abs([...g].reduce((a, c) => a + c.charCodeAt(0), 0)) % PALETTE.length;
    const h = PALETTE[i];
    const s = '90%';
    const l = theme === 'dark' ? '70%' : '45%';
    return `hsl(${h} ${s} ${l} / 1)`;
}

// --- Geometry & Layout ---
function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function rectsIntersect(a, b) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function placeLabel(bx, by, bw, bh, placed) {
    const step = 18;
    const attempts = [[0, 0], [0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1]];
    for (let ring = 0; ring < 6; ring++) {
        for (const [ox, oy] of attempts) {
            const rx = bx + ox * step * ring, ry = by + oy * step * ring;
            const r = { x: rx, y: ry, w: bw, h: bh };
            let ok = true;
            for (const p of placed) {
                if (rectsIntersect(r, p)) {
                    ok = false;
                    break;
                }
            }
            if (ok) return r;
        }
    }
    return { x: bx, y: by, w: bw, h: bh };
}

// --- Naming & Language ---
const groupOf = (id) => {
    if (!id) return '(root)';
    const s = id.replace(/\/g, '/').split('/').filter(Boolean);
    return s[0] || '(root)';
};

const getConnectionLabel = () => {
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';
    return lang === 'ko' ? '연결' : 'Connection';
};


// ===== Core graph engine =====
export class GraphEngine {
    constructor() {
        this.nodes = [];
        this.links = [];
        this.id2 = null;
        this.dim = 2;
        this.alpha = 0.12;
        this.repulsion = 2000;
        this.spring = 0.02;
        this.damping = 0.85;
        this.center = [0, 0, 0];
        this.physics = true;
    }

    load(g) {
        const saved = JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem('vanilla-graph-2d-pos')) || '{}');
        this.nodes = g.nodes.map((n) => ({ id: n.id, name: n.name || n.id, fixed: n.fixed ?? false, x: (saved[n.id]?.x) ?? rand(-200, 200), y: (saved[n.id]?.y) ?? rand(-200, 200), z: rand(-80, 80), vx: 0, vy: 0, vz: 0, group: groupOf(n.id) }));
        const byId = new Map(this.nodes.map(n => [n.id, n]));
        this.links = g.links.map(l => ({ source: byId.get(l.source), target: byId.get(l.target) }));
        this.id2 = byId;
    }

    setDim(d) {
        this.dim = d;
    }

    togglePhysics() {
        this.physics = !this.physics;
    }

    step() {
        if (!this.physics) return;
        const nodes = this.nodes, links = this.links, k = this.alpha;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                let dx = a.x - b.x, dy = a.y - b.y, dz = (this.dim === 3 ? a.z - b.z : 0);
                let d2 = dx * dx + dy * dy + (this.dim === 3 ? dz * dz : 0) + 0.01;
                let f = this.repulsion / d2; const invd = 1 / Math.sqrt(d2);
                dx *= invd; dy *= invd; if (this.dim === 3) dz *= invd;
                if (!a.fixed) { a.vx += dx * f * k; a.vy += dy * f * k; if (this.dim === 3) a.vz += dz * f * k; }
                if (!b.fixed) { b.vx -= dx * f * k; b.vy -= dy * f * k; if (this.dim === 3) b.vz -= dz * f * k; }
            }
        }
        for (const e of links) {
            const a = e.source, b = e.target;
            let dx = b.x - a.x, dy = b.y - a.y, dz = (this.dim === 3 ? b.z - a.z : 0);
            const dist = Math.sqrt(dx * dx + dy * dy + (this.dim === 3 ? dz * dz : 0)) + 0.001;
            const desired = 80; const diff = dist - desired; const force = this.spring * diff;
            const ux = dx / dist, uy = dy / dist, uz = (this.dim === 3 ? dz / dist : 0);
            if (!a.fixed) { a.vx += ux * force * k; a.vy += uy * force * k; if (this.dim === 3) a.vz += uz * force * k; }
            if (!b.fixed) { b.vx -= ux * force * k; b.vy -= uy * force * k; if (this.dim === 3) b.vz -= uz * force * k; }
        }
        for (const n of nodes) { if (!n.fixed) { n.vx *= this.damping; n.vy *= this.damping; if (this.dim === 3) n.vz *= this.damping; n.x += n.vx; n.y += n.vy; if (this.dim === 3) n.z += n.vz; } }
    }

    save2D() {
        if (typeof localStorage === 'undefined') return;
        const map = {};
        this.nodes.forEach(n => map[n.id] = { x: n.x, y: n.y });
        localStorage.setItem('vanilla-graph-2d-pos', JSON.stringify(map));
    }

    neighbors(node) {
        const adj = new Set();
        for (const e of this.links) {
            if (e.source === node) { adj.add(e.target); } else if (e.target === node) { adj.add(e.source); }
        }
        return adj;
    }
}

// ===== 2D Renderer =====
export class Renderer2D {
    constructor(canvas, overlay, engine, onNodeClick) {
        this.cv = canvas;
        this.ol = overlay;
        this.g = engine;
        this.ctx = canvas.getContext('2d');
        this.octx = overlay.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.panX = 0;
        this.panY = 0;
        this.scale = 1;
        this.hover = null;
        this.drag = null;
        this.draggingCanvas = false;
        this.fade = 0;
        this.downPos = null;
        this.wasDragging = false;
        this.onNodeClick = onNodeClick;
        this.tooltipEl = this._ensureTooltip();
        this.tooltipPos = { x: 0, y: 0, targetX: 0, targetY: 0 };

        this._onWheel = this._onWheel.bind(this);
        this._onDown = this._onDown.bind(this);
        this._onMove = this._onMove.bind(this);
        this._onUp = this._onUp.bind(this);
        this._onAuxClick = this._onAuxClick.bind(this);

        this._bind();
        this.resize();
    }

    dispose() {
        this.cv.removeEventListener('wheel', this._onWheel);
        this.cv.removeEventListener('mousedown', this._onDown);
        window.removeEventListener('mousemove', this._onMove);
        window.removeEventListener('mouseup', this._onUp);
        this.cv.removeEventListener('auxclick', this._onAuxClick);
        this.tooltipEl.remove();
    }

    resize() {
        const rect = this.cv.parentElement.getBoundingClientRect();
        for (const c of [this.cv, this.ol]) {
            c.width = rect.width * this.dpr;
            c.height = rect.height * this.dpr;
            c.style.width = rect.width + 'px';
            c.style.height = rect.height + 'px';
        }
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.octx.setTransform(1, 0, 0, 1, 0, 0);
        this.draw(true);
    }

    worldToScreen(x, y) {
        return [(x * this.scale + this.panX) * this.dpr + this.cv.width / 2, (y * this.scale + this.panY) * this.dpr + this.cv.height / 2];
    }

    screenToWorld(sx, sy) {
        const x = (sx - this.cv.width / 2) / (this.dpr * this.scale) - this.panX / this.scale;
        const y = (sy - this.cv.height / 2) / (this.dpr * this.scale) - this.panY / this.scale;
        return [x, y];
    }

    _bind() {
        this.cv.addEventListener('wheel', this._onWheel, { passive: false });
        this.cv.addEventListener('mousedown', this._onDown);
        window.addEventListener('mousemove', this._onMove);
        window.addEventListener('mouseup', this._onUp);
        this.cv.addEventListener('auxclick', this._onAuxClick);
        this.ol.addEventListener('dblclick', () => { this.panX = 0; this.panY = 0; this.scale = 1; this.draw(true); });
    }
    _hitTest(sx, sy) {
        const r2 = (12 * this.dpr) ** 2;
        let hit = null;
        for (const n of this.g.nodes) {
            const [x, y] = this.worldToScreen(n.x, n.y);
            if (dist2(x, y, sx, sy) <= r2) {
                hit = n;
                break;
            }
        }
        return hit;
    }

    _hitTestEdge(sx, sy) {
        const threshold = (8 * this.dpr) ** 2;
        let hit = null;
        for (const e of this.g.links) {
            const [ax, ay] = this.worldToScreen(e.source.x, e.source.y);
            const [bx, by] = this.worldToScreen(e.target.x, e.target.y);
            const dx = bx - ax, dy = by - ay;
            const len2 = dx * dx + dy * dy;
            if (len2 === 0) continue;
            const t = Math.max(0, Math.min(1, ((sx - ax) * dx + (sy - ay) * dy) / len2));
            const px = ax + t * dx, py = ay + t * dy;
            if (dist2(sx, sy, px, py) <= threshold) {
                hit = e;
                break;
            }
        }
        return hit;
    }

    _ensureTooltip() {
        const el = document.createElement('div');
        el.className = 'tooltip';
        this.cv.parentElement.appendChild(el);
        return el;
    }

    _updateTooltip(visible, content, x, y) {
        if (visible && content) {
            this.tooltipPos.targetX = x / this.dpr;
            this.tooltipPos.targetY = y / this.dpr;
            if (!this.tooltipEl.classList.contains('visible')) {
                this.tooltipPos.x = this.tooltipPos.targetX;
                this.tooltipPos.y = this.tooltipPos.targetY;
                this.tooltipEl.innerHTML = content;
                this.tooltipEl.classList.add('visible');
            }
        } else {
            this.tooltipEl.classList.remove('visible');
            this.tooltipPos.x = this.cv.width / 2 / this.dpr;
            this.tooltipPos.y = this.cv.height / 2 / this.dpr;
        }
    }
    _onWheel(e) {
        e.preventDefault();
        const rect = this.cv.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * this.dpr, cy = (e.clientY - rect.top) * this.dpr;
        const [wx, wy] = this.screenToWorld(cx, cy);
        const k = Math.exp(-e.deltaY * 0.001);
        this.scale = clamp(this.scale * k, 0.2, 4);
        const [sx, sy] = this.worldToScreen(wx, wy);
        this.panX += (cx - sx) / this.dpr;
        this.panY += (cy - sy) / this.dpr;
        this.draw(true);
    }

    _onAuxClick(e) {
        if (e.button !== 1) return;
        e.preventDefault();
        const rect = this.cv.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.dpr, y = (e.clientY - rect.top) * this.dpr;
        const node = this._hitTest(x, y);
        if (node) {
            node.fixed = !node.fixed;
            this.draw(false);
        }
    }

    _onDown(e) {
        if (e.button !== 0) return;
        this.wasDragging = false;
        this.downPos = { x: e.clientX, y: e.clientY };
        const rect = this.cv.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.dpr, y = (e.clientY - rect.top) * this.dpr;
        const node = this._hitTest(x, y);
        if (e.shiftKey && node) {
            node.fixed = !node.fixed;
            this.draw(false);
            return;
        }
        if (node) {
            this.drag = node;
        } else {
            this.draggingCanvas = true;
            this.last = { x: e.clientX, y: e.clientY };
        }
    }

    _onMove(e) {
        const isDragging = this.drag || this.draggingCanvas;
        if (isDragging && !this.wasDragging) {
            const dist = this.downPos ? Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y) : 0;
            if (dist > 3) {
                this.wasDragging = true;
            }
        }
        const rect = this.cv.getBoundingClientRect();
        const sx = (e.clientX - rect.left) * this.dpr, sy = (e.clientY - rect.top) * this.dpr;
        if (this.wasDragging) {
            this._updateTooltip(false);
            if (this.drag) {
                const [wx, wy] = this.screenToWorld(sx, sy);
                this.drag.x = wx;
                this.drag.y = wy;
                this.g.save2D();
                this.draw(false);
                return;
            }
            if (this.draggingCanvas) {
                this.panX += (e.clientX - this.last.x);
                this.panY += (e.clientY - this.last.y);
                this.last = { x: e.clientX, y: e.clientY };
                this.draw(true);
                return;
            }
        }
        const h = this._hitTest(sx, sy);
        const edgeHit = h ? null : this._hitTestEdge(sx, sy); // Only check edges if no node hit

        if (h !== this.hover) {
            this.hover = h;
            this.cv.style.cursor = (h || edgeHit) ? 'pointer' : 'default';
        }

        if (h) {
            const theme = document.documentElement.getAttribute('data-theme') || 'dark';
            const color = colorForGroup(h.group, theme);
            const content = `<b>${h.name}</b><span class="chip" style="background:${color}20">${h.group}</span><div style="opacity:.8">${h.id}</div>`;
            this._updateTooltip(true, content, sx, sy);
        } else if (edgeHit) {
            const theme = document.documentElement.getAttribute('data-theme') || 'dark';
            const sourceColor = colorForGroup(edgeHit.source.group, theme);
            const targetColor = colorForGroup(edgeHit.target.group, theme);
            const content = `
          <div style="font-weight: 600; margin-bottom: 6px; font-size: 11px; opacity: 0.8;">${getConnectionLabel()}</div>
          <div style="margin-top: 6px; margin-bottom: 4px;">
            <div style="margin-bottom: 3px;">
              <span style="color:${sourceColor}; font-weight: 600; font-size: 11px;">${edgeHit.source.name}</span>
            </div>
            <div style="opacity: 0.5; font-size: 10px; margin: 2px 0;">↓</div>
            <div>
              <span style="color:${targetColor}; font-weight: 600; font-size: 11px;">${edgeHit.target.name}</span>
            </div>
          </div>
          <div style="opacity: 0.6; font-size: 9px; margin-top: 6px; padding-top: 6px; border-top: 1px solid currentColor; opacity: 0.3;">${edgeHit.source.id} → ${edgeHit.target.id}</div>
        `;
            this._updateTooltip(true, content, sx, sy);
        } else {
            this._updateTooltip(false);
        }
    }

    _onUp(e) {
        if (this.drag && !this.wasDragging) {
            if (this.onNodeClick) {
                this.onNodeClick(this.drag);
            }
        }
        if (this.drag) {
            this.g.save2D();
        }
        this.drag = null;
        this.draggingCanvas = false;
        this.downPos = null;
    }
    draw(withGrid) {
        const target = this.hover ? 1 : 0;
        this.fade = lerp(this.fade, target, 0.2);
        const { ctx, octx } = this;
        const w = this.cv.width, h = this.cv.height;
        ctx.clearRect(0, 0, w, h);
        octx.clearRect(0, 0, w, h);
        if (withGrid) {
            ctx.save();
            ctx.strokeStyle = '#ffffff11';
            ctx.lineWidth = 1;
            const step = 40 * this.scale * this.dpr;
            for (let x = w / 2 + this.panX * this.dpr % step; x < w; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let x = w / 2 + this.panX * this.dpr % step; x > 0; x -= step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = h / 2 + this.panY * this.dpr % step; y < h; y += step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            for (let y = h / 2 + this.panY * this.dpr % step; y > 0; y -= step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            ctx.restore();
        }
        const hover = this.hover;
        const neighbors = hover ? this.g.neighbors(hover) : null;
        for (const e of this.g.links) {
            const a = e.source, b = e.target;
            const [ax, ay] = this.worldToScreen(a.x, a.y);
            const [bx, by] = this.worldToScreen(b.x, b.y);
            let base = .3;
            let hi = .8, dim = .15;
            let alpha = base;
            if (hover) {
                const isN = (a === hover || b === hover) || (neighbors && (neighbors.has(a) || neighbors.has(b)));
                alpha = lerp(base, isN ? hi : dim, this.fade);
            }
            ctx.strokeStyle = `rgba(148, 163, 184,${alpha})`;
            ctx.lineWidth = (hover && (a === hover || b === hover)) ? 2.5 : 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
        }
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        for (const n of this.g.nodes) {
            const [x, y] = this.worldToScreen(n.x, n.y);
            const color = colorForGroup(n.group, theme);
            const isH = n === this.hover;
            const isN = this.hover && (this.g.neighbors(this.hover).has(n));
            let base = 1, hi = 1, nb = .9, dim = .35;
            let alpha = base;
            if (this.hover) {
                alpha = isH ? lerp(base, hi, this.fade) : isN ? lerp(base, nb, this.fade) : lerp(base, dim, this.fade);
            }
            ctx.fillStyle = color.replace('/ 1', `/ ${alpha}`);
            ctx.beginPath();
            ctx.arc(x, y, 10 * this.dpr, 0, Math.PI * 2);
            ctx.fill();
            if (n.fixed) {
                ctx.save();
                ctx.shadowColor = color;
                ctx.shadowBlur = 8 * this.dpr;
                ctx.strokeStyle = color;
                ctx.lineWidth = 4 * this.dpr;
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.strokeStyle = 'rgba(0,0,0,.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        const placed = [];
        octx.save();
        octx.font = `${Math.round(13 * this.dpr)}px system-ui, sans-serif`;
        octx.textBaseline = 'middle';
        const textColor = theme === 'dark' ? '#e6edf3' : '#1e293b';
        for (const n of this.g.nodes) {
            const [sx, sy] = this.worldToScreen(n.x, n.y);
            const isH = n === this.hover;
            const isN = this.hover && (this.g.neighbors(this.hover).has(n));
            let base = 1, hi = 1, nb = .9, dim = .35;
            let alpha = base;
            if (this.hover) {
                alpha = isH ? lerp(base, hi, this.fade) : isN ? lerp(base, nb, this.fade) : lerp(base, dim, this.fade);
            }
            if (alpha < 0.4) continue;
            octx.globalAlpha = alpha * alpha;
            const label = n.name;
            const padX = 10;
            const tw = octx.measureText(label).width;
            const bw = tw + padX * 2 * this.dpr, bh = Math.round(22 * this.dpr);
            const box = placeLabel(sx + 15 * this.dpr, sy - bh / 2, bw, bh, placed);
            placed.push(box);
            octx.strokeStyle = 'rgba(0,0,0,0.25)';
            octx.lineWidth = 1 * this.dpr;
            octx.beginPath();
            octx.moveTo(sx + 10 * this.dpr, sy);
            octx.lineTo(box.x - 2 * this.dpr, box.y + box.h / 2);
            octx.stroke();
            octx.fillStyle = theme === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)';
            roundRect(octx, box.x, box.y, box.w, box.h, 11 * this.dpr);
            octx.fill();
            octx.fillStyle = textColor;
            octx.fillText(label, box.x + padX * this.dpr, box.y + box.h / 2);
        }
        octx.restore();
        if (this.tooltipEl.classList.contains('visible')) {
            this.tooltipPos.x = lerp(this.tooltipPos.x, this.tooltipPos.targetX, 0.25);
            this.tooltipPos.y = lerp(this.tooltipPos.y, this.tooltipPos.targetY, 0.25);
            this.tooltipEl.style.transform = `translate(${this.tooltipPos.x}px, ${this.tooltipPos.y}px) translate(-50%, -110%) scale(1)`;
        }
    }

// ===== 3D Renderer (using Three.js directly) =====
export class Renderer3D {
    constructor(container, engine, onNodeClick) {
        this._dirtyEdges = new Set();
        this._dirtyNodes = new Set();

        this.container = container;
        this.engine = engine;
        this.onNodeClick = onNodeClick;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.nodeMeshes = [];
        this.linkLines = [];
        this.labels = [];
        this.hoveredNode = null;
        this.hoveredEdge = null;
        this.draggedNode = null;
        this.isDragging = false;
        this.hasDragged = false;
        this.animationId = null;

        // Fade animation state
        this.fadeTargets = new Map(); // Store target opacity/intensity for each object
        this.fadeActive = false;

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onAuxClick = this._onAuxClick.bind(this);
        this._onResize = this._onResize.bind(this);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('mousedown', this._onMouseDown);
        this.container.removeEventListener('mouseup', this._onMouseUp);
        this.container.removeEventListener('click', this._onClick);
        this.container.removeEventListener('auxclick', this._onAuxClick);
        window.removeEventListener('resize', this._onResize);

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        // Clean up Three.js objects
        this.nodeMeshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        this.linkLines.forEach(line => {
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        });
        this.labels.forEach(sprite => {
            if (sprite.material) {
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
            }
        });

        if (this.scene) {
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
        }

        this.container.innerHTML = '';

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.nodeMeshes = [];
        this.linkLines = [];
        this.labels = [];
    }

    resize() {
        if (!this.camera || !this.renderer) return;

        const rect = this.container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 600;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    render() {
        if (this.scene) {
            this.dispose();
        }

        const rect = this.container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 600;
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';

        // Three.js presence check
        if (typeof THREE === 'undefined') {
            throw new Error('THREE is required for 3D rendering. Include three.min.js before using 3D mode.');
        }

        // Setup Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(theme === 'dark' ? 0x0f172a : 0xf8fafc);

        this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 5000);
        this.camera.position.set(0, 0, 500);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
        }

        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line.threshold = 5;
        this.raycaster.params.Points.threshold = 10;
        this.mouse = new THREE.Vector2();

        // Create graph
        this._createGraph(theme);

        // Event listeners (use renderer canvas for stable picking)
        const _target = this.renderer && this.renderer.domElement ? this.renderer.domElement : this.container;
        _target.addEventListener('mousemove', this._onMouseMove);
        _target.addEventListener('mousedown', this._onMouseDown);
        _target.addEventListener('mouseup', this._onMouseUp);
        _target.addEventListener('click', this._onClick);
        _target.addEventListener('auxclick', this._onAuxClick);
        window.addEventListener('resize', this._onResize);

        // Start animation
        this._animate();

        // Fit camera
        this._fitCamera();
    }

    _createGraph(theme) {
        const nodes = this.engine.nodes;
        const links = this.engine.links;

        // Create links with thicker lines for better hover detection
        links.forEach(link => {
            const source = link.source;
            const target = link.target;

            // Create tube geometry for better raycasting
            const path = new THREE.LineCurve3(
                new THREE.Vector3(source.x, source.y, source.z),
                new THREE.Vector3(target.x, target.y, target.z)
            );

            const tubeGeometry = new THREE.TubeGeometry(path, 1, 3, 8, false); // Increased radius from 2 to 3
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: theme === 'dark' ? 0x94a3b8 : 0x64748b,
                opacity: 0.3,
                transparent: true
            });

            const tube = new THREE.Mesh(tubeGeometry, lineMaterial);
            tube.userData = { source, target, isEdge: true, edgeId: `${source.id}→${target.id}` };
            tube.renderOrder = -1; // Render edges before nodes
            this.scene.add(tube);
            this.linkLines.push(tube);
        });

        // Create nodes
        const nodeGeometry = new THREE.SphereGeometry(12, 16, 16); // Increased from 8 to 12

        nodes.forEach(node => {
            const color = this._hexToColor(colorForGroup(node.group, theme));
            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.2,
                shininess: 30,
                transparent: true,
                opacity: 1.0
            });

            const mesh = new THREE.Mesh(nodeGeometry, material);
            mesh.position.set(node.x, node.y, node.z);
            mesh.userData = { node, nodeId: node.id };

            // Apply fixed node appearance if needed
            if (node.fixed) {
                mesh.material.emissiveIntensity = 0.5;
                mesh.scale.set(1.2, 1.2, 1.2);
            }

            this.scene.add(mesh);
            this.nodeMeshes.push(mesh);

            // Create label with better visibility
            if (typeof SpriteText !== 'undefined') {
                const sprite = new SpriteText(node.name);
                sprite.color = theme === 'dark' ? '#e6edf3' : '#1e293b';
                sprite.textHeight = 8;
                sprite.fontFace = 'system-ui, sans-serif';
                sprite.fontWeight = '600';
                sprite.backgroundColor = theme === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)';
                sprite.padding = 6;
                sprite.borderRadius = 6;
                sprite.borderWidth = 1;
                sprite.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
                sprite.position.set(node.x, node.y + 20, node.z);
                sprite.material.depthTest = false; // Always render on top
                sprite.renderOrder = 999; // Render after everything else
                this.scene.add(sprite);
                this.labels.push(sprite);
            }
        });

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(100, 100, 100);
        this.scene.add(directionalLight);
    }

    _hexToColor(hexString) {
        // Convert "hsl(220 90% 70% / 1)" to THREE.Color
        const match = hexString.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%/);
        if (match) {
            const h = parseInt(match[1]) / 360;
            const s = parseInt(match[2]) / 100;
            const l = parseInt(match[3]) / 100;
            const color = new THREE.Color();
            color.setHSL(h, s, l);
            return color;
        }
        return new THREE.Color(0x6ea8fe);
    }

    _animate() {
        this.animationId = requestAnimationFrame(() => this._animate());
        if (this.controls) this.controls.update();

        // Run physics simulation
        if (this.engine && this.engine.physics && !this.isDragging) {
            this.engine.step();

            // Mark all nodes and edges as dirty after physics step
            this.engine.nodes.forEach(n => {
                if (this._dirtyNodes) this._dirtyNodes.add(n.id);
            });
            this.engine.links.forEach(e => {
                const id = `${e.source.id}→${e.target.id}`;
                if (this._dirtyEdges) this._dirtyEdges.add(id);
            });
        }

        // Update only dirty edges
        if (this._dirtyEdges && this._dirtyEdges.size) {
            for (const tube of this.linkLines) {
                const id = tube.userData && tube.userData.edgeId;
                if (!id || !this._dirtyEdges.has(id)) continue;
                const { source, target } = tube.userData;
                const path = new THREE.LineCurve3(
                    new THREE.Vector3(source.x, source.y, source.z),
                    new THREE.Vector3(target.x, target.y, target.z)
                );
                if (tube.geometry) tube.geometry.dispose();
                tube.geometry = new THREE.TubeGeometry(path, 1, 3, 8, false); // Match initial radius
            }
            this._dirtyEdges.clear();
        }

        // Update only dirty nodes (mesh + label)
        if (this._dirtyNodes && this._dirtyNodes.size) {
            for (let i = 0; i < this.nodeMeshes.length; i++) {
                const mesh = this.nodeMeshes[i];
                const node = mesh.userData && mesh.userData.node;
                if (!node || !this._dirtyNodes.has(node.id)) continue;
                mesh.position.set(node.x, node.y, node.z);
                if (this.labels[i]) this.labels[i].position.set(node.x, node.y + 20, node.z);
            }
            this._dirtyNodes.clear();
        }

        // Animate fade effect
        if (this.fadeActive && this.fadeTargets.size > 0) {
            this.fadeTargets.forEach((target, obj) => {
                if (obj.material) {
                    // Lerp opacity
                    if (target.opacity !== undefined) {
                        const current = obj.material.opacity || 0;
                        obj.material.opacity = lerp(current, target.opacity, 0.15);
                    }

                    // Lerp emissive intensity
                    if (target.emissiveIntensity !== undefined) {
                        const current = obj.material.emissiveIntensity || 0;
                        obj.material.emissiveIntensity = lerp(current, target.emissiveIntensity, 0.15);
                    }
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    _onMouseMove(event) {
        if (!this.renderer || !this.camera) return;

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Handle dragging
        if (this.isDragging && this.draggedNode) {
            this.hasDragged = true; // Mark that dragging has occurred

            if (this.controls) this.controls.enabled = false;
            const node = this.draggedNode.userData.node;

            // Don't drag fixed nodes
            if (node.fixed) {
                return;
            }

            const deltaX = event.movementX || 0;
            const deltaY = event.movementY || 0;

            // Get camera right and up vectors
            const cameraRight = new THREE.Vector3();
            const cameraUp = new THREE.Vector3();
            const cameraDir = new THREE.Vector3();

            this.camera.getWorldDirection(cameraDir);
            cameraRight.crossVectors(cameraDir, this.camera.up).normalize();
            cameraUp.crossVectors(cameraRight, cameraDir).normalize();

            if (event.ctrlKey || event.metaKey) {
                // Ctrl+Drag for depth movement (towards/away from camera)
                const depthDelta = deltaY * 2.0;
                node.x += cameraDir.x * depthDelta;
                node.y += cameraDir.y * depthDelta;
                node.z += cameraDir.z * depthDelta;
            } else {
                // Default: Camera-relative XY dragging
                const moveFactor = 1.5;

                // Move along camera's right and up vectors
                node.x += (cameraRight.x * deltaX - cameraUp.x * deltaY) * moveFactor;
                node.y += (cameraRight.y * deltaX - cameraUp.y * deltaY) * moveFactor;
                node.z += (cameraRight.z * deltaX - cameraUp.z * deltaY) * moveFactor;
            }

            node.vx = 0;
            node.vy = 0;
            node.vz = 0;

            if (this._dirtyNodes) this._dirtyNodes.add(node.id);
            if (this.engine && this.engine.links) {
                for (const e of this.engine.links) {
                    if (e.source === node || e.target === node) {
                        const id = `${e.source.id}→${e.target.id}`;
                        if (this._dirtyEdges) this._dirtyEdges.add(id);
                    }
                }
            }
            this._hideTooltip();
            return;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check both nodes and edges
        const nodeIntersects = this.raycaster.intersectObjects(this.nodeMeshes);
        const edgeIntersects = this.raycaster.intersectObjects(this.linkLines);

        // Prioritize nodes for dragging, but allow edge tooltips
        if (nodeIntersects.length > 0) {
            const mesh = nodeIntersects[0].object;

            // Clear edge hover
            if (this.hoveredEdge) {
                this.hoveredEdge.material.opacity = 0.3;
                this.hoveredEdge = null;
            }

            if (this.hoveredNode !== mesh) {
                if (this.hoveredNode && this.hoveredNode !== this.draggedNode) {
                    this.hoveredNode.material.emissiveIntensity = 0.2;
                }
                this.hoveredNode = mesh;
                if (!this.isDragging) {
                    this.hoveredNode.material.emissiveIntensity = 0.5;
                }

                // Apply fade effect
                this._applyFadeEffect(mesh);
            }

            this.container.style.cursor = 'grab';

            // Show node tooltip
            if (!this.isDragging) {
                this._showTooltip(mesh.userData.node, event.clientX, event.clientY, 'node');
            }
        } else if (edgeIntersects.length > 0 && !this.isDragging) {
            // Edge hovered (no node nearby)
            const tube = edgeIntersects[0].object;

            // Clear node hover
            if (this.hoveredNode) {
                this.hoveredNode.material.emissiveIntensity = 0.2;
                this.hoveredNode = null;
            }

            // Highlight edge
            if (this.hoveredEdge !== tube) {
                if (this.hoveredEdge) {
                    this.hoveredEdge.material.opacity = 0.3;
                }
                this.hoveredEdge = tube;
            }

            // Always set opacity when hovering to ensure visibility
            this.hoveredEdge.material.opacity = 0.8;

            // Apply fade effect
            this._applyFadeEffect(null);

            this.container.style.cursor = 'pointer';

            // Show edge tooltip (always update position)
            const { source, target } = tube.userData;
            this._showTooltip({ source, target }, event.clientX, event.clientY, 'edge');
        } else {
            // Nothing hovered - clear all
            if (this.hoveredNode && !this.isDragging) {
                this.hoveredNode.material.emissiveIntensity = 0.2;
                this.hoveredNode = null;
            }
            if (this.hoveredEdge) {
                this.hoveredEdge.material.opacity = 0.3;
                this.hoveredEdge = null;
            }

            // Clear fade effect
            this._clearFadeEffect();

            if (!this.isDragging) {
                this.container.style.cursor = 'default';
                this._hideTooltip();
            }
        }
    }

    _onMouseDown(event) {
        if (event.button !== 0) return; // Only left click

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const nodeIntersects = this.raycaster.intersectObjects(this.nodeMeshes);

        if (nodeIntersects.length > 0) {
            const node = nodeIntersects[0].object.userData.node;

            // Shift+click to toggle fixed
            if (event.shiftKey) {
                node.fixed = !node.fixed;
                this._updateNodeAppearance(nodeIntersects[0].object);
                this.shiftClicked = true; // Mark that shift was used
                return;
            }

            this.draggedNode = nodeIntersects[0].object;
            this.isDragging = true;
            this.hasDragged = false; // Reset drag flag
            this.shiftClicked = false;
            this.container.style.cursor = 'grabbing';
            this._hideTooltip();
        }
    }

    _onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedNode = null;
            this.container.style.cursor = 'default';

            // Re-enable controls
            if (this.controls) {
                this.controls.enabled = true;
            }
        }
    }

    _onClick(event) {
        // Don't trigger click if shift was used for fixing
        if (this.shiftClicked) {
            this.shiftClicked = false;
            return;
        }

        // Only trigger click if not dragged
        if (this.hasDragged) {
            this.hasDragged = false; // Reset for next interaction
            return;
        }

        if (!this.hoveredNode) return;

        const node = this.hoveredNode.userData.node;
        if (this.onNodeClick) {
            this.onNodeClick(node);
        }
    }

    _onAuxClick(event) {
        if (event.button !== 1) return; // Only middle click
        event.preventDefault();

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const nodeIntersects = this.raycaster.intersectObjects(this.nodeMeshes);

        if (nodeIntersects.length > 0) {
            const node = nodeIntersects[0].object.userData.node;
            node.fixed = !node.fixed;
            this._updateNodeAppearance(nodeIntersects[0].object);
        }
    }

    _onResize() {
        this.resize();
    }

    _updateNodeAppearance(mesh) {
        const node = mesh.userData.node;
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const baseColor = this._hexToColor(colorForGroup(node.group, theme));

        if (node.fixed) {
            // Fixed node: add glow effect
            mesh.material.emissive = baseColor;
            mesh.material.emissiveIntensity = 0.5;

            // Make it slightly larger
            mesh.scale.set(1.2, 1.2, 1.2);
        } else {
            // Normal node
            mesh.material.emissive = baseColor;
            mesh.material.emissiveIntensity = 0.2;
            mesh.scale.set(1, 1, 1);
        }
    }

    _applyFadeEffect(hoveredMesh) {
        if (!hoveredMesh) return;

        this.fadeActive = true;
        this.fadeTargets.clear();

        const hoveredNode = hoveredMesh.userData.node;

        // Find connected nodes and edges
        const connectedNodes = new Set();
        const connectedEdges = new Set();

        this.linkLines.forEach(tube => {
            const { source, target } = tube.userData;
            if (source.id === hoveredNode.id || target.id === hoveredNode.id) {
                connectedEdges.add(tube);
                connectedNodes.add(source);
                connectedNodes.add(target);
            }
        });

        // Set fade targets for all nodes
        this.nodeMeshes.forEach(mesh => {
            const node = mesh.userData.node;
            const isHovered = mesh === hoveredMesh;
            const isConnected = connectedNodes.has(node);

            // Enable transparency for all nodes
            if (!mesh.material.transparent) {
                mesh.material.transparent = true;
                mesh.material.needsUpdate = true;
            }

            if (isHovered) {
                this.fadeTargets.set(mesh, { opacity: 1.0, emissiveIntensity: 0.6 });
            } else if (isConnected) {
                this.fadeTargets.set(mesh, { opacity: 0.85, emissiveIntensity: 0.3 });
            } else {
                this.fadeTargets.set(mesh, { opacity: 0.15, emissiveIntensity: 0.05 });
            }
        });

        // Set fade targets for labels
        this.labels.forEach((sprite, i) => {
            const mesh = this.nodeMeshes[i];
            const node = mesh.userData.node;
            const isHovered = mesh === hoveredMesh;
            const isConnected = connectedNodes.has(node);

            if (isHovered) {
                this.fadeTargets.set(sprite, { opacity: 1.0 });
            } else if (isConnected) {
                this.fadeTargets.set(sprite, { opacity: 0.85 });
            } else {
                this.fadeTargets.set(sprite, { opacity: 0.05 });
            }
        });

        // Set fade targets for edges
        this.linkLines.forEach(tube => {
            if (connectedEdges.has(tube)) {
                this.fadeTargets.set(tube, { opacity: 0.8 });
            } else {
                this.fadeTargets.set(tube, { opacity: 0.02 });
            }
        });
    }

    _clearFadeEffect() {
        if (!this.fadeActive) return;

        this.fadeActive = true;
        this.fadeTargets.clear();

        // Set restore targets for all nodes
        this.nodeMeshes.forEach(mesh => {
            const node = mesh.userData.node;

            // Restore emissive intensity based on fixed state
            const targetIntensity = node.fixed ? 0.5 : 0.2;

            this.fadeTargets.set(mesh, {
                opacity: 1.0,
                emissiveIntensity: targetIntensity
            });
        });

        // Set restore targets for labels
        this.labels.forEach(sprite => {
            this.fadeTargets.set(sprite, { opacity: 1.0 });
        });

        // Set restore targets for edges
        this.linkLines.forEach(tube => {
            this.fadeTargets.set(tube, { opacity: 0.3 });
        });
    }

    _showTooltip(data, x, y, type) {
        let tooltip = document.getElementById('graph-3d-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'graph-3d-tooltip';
            tooltip.className = 'graph-3d-tooltip';
            // Append to container for proper relative positioning
            this.container.appendChild(tooltip);
        }

        const theme = document.documentElement.getAttribute('data-theme') || 'dark';

        if (type === 'node') {
            const color = colorForGroup(data.group, theme);
            tooltip.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 6px; font-size: 13px;">${data.name}</div>
        <div style="display: inline-block; padding: 3px 10px; border-radius: 12px; background: ${color}22; color: ${color}; font-size: 11px; font-weight: 600; margin-bottom: 6px;">${data.group}</div>
        <div style="opacity: 0.7; font-size: 11px; margin-top: 4px; word-break: break-all;">${data.id}</div>
      `;
        } else if (type === 'edge') {
            const { source, target } = data;
            const sourceColor = colorForGroup(source.group, theme);
            const targetColor = colorForGroup(target.group, theme);
            tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 6px; font-size: 12px; opacity: 0.8;">${getConnectionLabel()}</div>
        <div style="margin-top: 6px; margin-bottom: 4px;">
          <div style="margin-bottom: 3px;">
            <span style="color: ${sourceColor}; font-weight: 600; font-size: 12px;">${source.name}</span>
          </div>
          <div style="opacity: 0.5; font-size: 11px; margin: 2px 0;">↓</div>
          <div>
            <span style="color: ${targetColor}; font-weight: 600; font-size: 12px;">${target.name}</span>
          </div>
        </div>
        <div style="opacity: 0.6; font-size: 10px; margin-top: 6px; padding-top: 6px; border-top: 1px solid currentColor; border-opacity: 0.1;">${source.id} → ${target.id}</div>
      `;
        }

        // Convert to container-relative coordinates
        const rect = this.container.getBoundingClientRect();
        const relX = x - rect.left;
        const relY = y - rect.top;

        // Position and show with animation
        tooltip.style.left = relX + 15 + 'px';
        tooltip.style.top = relY + 15 + 'px';

        // Trigger reflow to enable animation
        tooltip.offsetHeight;
        tooltip.classList.add('visible');
    }

    _hideTooltip() {
        const tooltip = document.getElementById('graph-3d-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    _fitCamera() {
        if (this.nodeMeshes.length === 0) return;

        const box = new THREE.Box3();
        this.nodeMeshes.forEach(mesh => {
            box.expandByObject(mesh);
        });

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

        this.camera.position.set(center.x, center.y, center.z + cameraZ);
        this.camera.lookAt(center);

        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }

    setTheme(theme) {
        if (!this.scene || !this.renderer) return;

        this.scene.background = new THREE.Color(theme === 'dark' ? 0x0f172a : 0xf8fafc);

        // Update node colors
        this.nodeMeshes.forEach(mesh => {
            const node = mesh.userData.node;
            const color = this._hexToColor(colorForGroup(node.group, theme));
            mesh.material.color = color;
            mesh.material.emissive = color;
        });

        // Update labels (SpriteText uses 'color' property directly)
        const labelColor = theme === 'dark' ? '#e6edf3' : '#1e293b';
        const labelBg = theme === 'dark' ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)';
        this.labels.forEach((sprite) => {
            sprite.color = labelColor;
            sprite.backgroundColor = labelBg;
        });

        // Update link colors
        const linkColor = theme === 'dark' ? 0x94a3b8 : 0x64748b;
        this.linkLines.forEach(line => {
            line.material.color.setHex(linkColor);
        });
    }
}

// ===== App (headless core; no header UI) =====
export class VanillaGraph {
    constructor(container, { data = SAMPLE, mode = '2d', onNodeClick = null } = {}) {
        if (!container) throw new Error('container is required');
        this.container = container;
        this.onNodeClick = onNodeClick;

        // Ensure container has explicit dimensions
        if (!container.style.position || container.style.position === 'static') {
            container.style.position = 'relative';
        }
        if (!container.style.width) {
            container.style.width = '100%';
        }
        if (!container.style.height) {
            container.style.height = '100%';
        }

        // Create separate containers for 2D and 3D
        this.wrap2d = document.createElement('div');
        Object.assign(this.wrap2d.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            display: 'block'
        });

        this.wrap3d = document.createElement('div');
        Object.assign(this.wrap3d.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            display: 'none'
        });

        this.canvas2d = document.createElement('canvas');
        this.overlay = document.createElement('canvas');
        Object.assign(this.canvas2d.style, { position: 'absolute', inset: '0' });
        Object.assign(this.overlay.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
        this.wrap2d.append(this.canvas2d, this.overlay);

        container.appendChild(this.wrap2d);
        container.appendChild(this.wrap3d);

        this.engine = new GraphEngine(); this.engine.load(data);
        this.r2d = new Renderer2D(this.canvas2d, this.overlay, this.engine, this.onNodeClick);
        this.r3d = new Renderer3D(this.wrap3d, this.engine, this.onNodeClick);

        this.mode = '2d';
        this.setMode(mode);

        this._rafId = null; this._loop();

        this._vis = () => {
            if (document.visibilityState === 'visible') {
                if (this.mode === '2d') {
                    this.r2d.resize();
                } else if (this.r3d) {
                    this.r3d.resize();
                }
            }
        };
        addEventListener('visibilitychange', this._vis);

        // Handle window resize
        this._resize = () => {
            if (this.mode === '2d') {
                this.r2d.resize();
            } else if (this.r3d) {
                this.r3d.resize();
            }
        };
        addEventListener('resize', this._resize);
    }
    setMode(m) {
        if (this.mode === m) return;
        this.mode = m;

        if (m === '2d') {
            this.wrap2d.style.display = 'block';
            this.wrap3d.style.display = 'none';
            this.r3d.dispose();
            this.engine.setDim(2);
            this.r2d.resize();
            this.r2d.draw(true);
        } else {
            if (typeof THREE === 'undefined') {
                console.warn('THREE not found; staying in 2D');
                this.mode = '2d';
                return;
            }
            this.wrap2d.style.display = 'none';
            this.wrap3d.style.display = 'block';
            this.engine.setDim(3);
            this.r3d.render();
        }
    }
    setTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        if (this.mode === '2d') { this.r2d.draw(true); } else { this.r3d.setTheme(t); }
    }
    togglePhysics() { this.engine.togglePhysics(); if (this.mode === '2d') this.r2d.draw(false); }
    reset() {
        if (this.mode === '2d') {
            this.r2d.panX = 0;
            this.r2d.panY = 0;
            this.r2d.scale = 1;
            this.r2d.draw(true);
        } else { if (this.r3d.graph) this.r3d.graph.zoomToFit(400); }
    }
    load(data) {
        this.engine.load(data);
        if (this.mode === '3d') {
            this.r3d.render();
        } else {
            this.r2d.draw(true);
        }
    }
    destroy() {
        cancelAnimationFrame(this._rafId);
        removeEventListener('visibilitychange', this._vis);
        removeEventListener('resize', this._resize);
        this.r2d.dispose();
        this.r3d.dispose();
        this.container.innerHTML = '';
    }
    _loop() {
        if (this.mode === '2d') {
            this.engine.step();
            this.r2d.draw(false);
        }
        this._rafId = requestAnimationFrame(() => this._loop());
    }
}

export function createVanillaGraph(container, opts) { return new VanillaGraph(container, opts); }
