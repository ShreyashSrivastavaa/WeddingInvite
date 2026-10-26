import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { soundFx } from '../../lib/audioSynthesizer';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Eye,
  Info,
} from 'lucide-react';

interface WeddingItem {
  id: string;
  title: string;
  partnerOneName: string;
  partnerTwoName?: string;
  rsvpDeadline: string;
  _count?: {
    events?: number;
    households?: number;
  };
}

interface CurvedAtelierGalleryWebGLProps {
  weddings: WeddingItem[];
  onSelectWedding: (wedding: WeddingItem) => void;
  onOpenCreate: () => void;
}

export const CurvedAtelierGalleryWebGL: React.FC<CurvedAtelierGalleryWebGLProps> = ({
  weddings,
  onSelectWedding,
  onOpenCreate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const [activeWedding, setActiveWedding] = useState<WeddingItem | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // References for Three.js state
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cardMeshes: THREE.Mesh[];
    particleSystem: THREE.Points;
    particleVelocities: Float32Array;
    pointLight: THREE.PointLight;
    mouse: THREE.Vector2;
    raycaster: THREE.Raycaster;
    rotationTarget: number;
    rotationCurrent: number;
    targetCameraZ: number;
    reqId: number;
    isDragging: boolean;
    dragStartX: number;
    lastDragX: number;
    dragVelocity: number;
  } | null>(null);

  // Toggle Sound
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
  };

  // Helper to draw a rich, tactile card texture on an offscreen 2D canvas
  const createCardTexture = (w: WeddingItem, index: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d')!;

    // 1. Linen Earthen Paper Background
    ctx.fillStyle = '#faf5eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle paper grain noise
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Double deckle border
    ctx.strokeStyle = '#666e72';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.strokeStyle = '#cacab0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

    // 4. Header Badge / Motif
    ctx.fillStyle = '#f2e9cf';
    ctx.fillRect(80, 80, 260, 60);
    ctx.strokeStyle = '#cacab0';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, 260, 60);

    ctx.fillStyle = '#484036';
    ctx.font = '32px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${w._count?.events || 1} EVENT${(w._count?.events || 1) === 1 ? '' : 'S'} • ATELIER`, 105, 110);

    // Index serial
    ctx.fillStyle = '#666e72';
    ctx.font = '28px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`NO. ${String(index + 1).padStart(2, '0')}`, canvas.width - 80, 110);
    ctx.textAlign = 'left';

    // 5. Wax Seal Emblem (Procedural Gold / Terracotta Seal)
    const sealX = canvas.width / 2;
    const sealY = 320;
    const sealRadius = 90;

    const grad = ctx.createRadialGradient(sealX - 25, sealY - 25, 10, sealX, sealY, sealRadius);
    grad.addColorStop(0, '#e5be85');
    grad.addColorStop(0.5, '#b97b39');
    grad.addColorStop(1, '#694119');

    ctx.save();
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(72, 64, 54, 0.4)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fill();

    // Wax seal inner embossed ring
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius - 16, 0, Math.PI * 2);
    ctx.strokeStyle = '#f8e3c5';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Royal Monogram in seal
    ctx.fillStyle = '#faf5eb';
    ctx.font = 'italic bold 64px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = `${w.partnerOneName.charAt(0)}${w.partnerTwoName ? '&' + w.partnerTwoName.charAt(0) : ''}`;
    ctx.fillText(initials, sealX, sealY);
    ctx.restore();

    // 6. Wedding Title (Large Display Typography)
    ctx.fillStyle = '#33302c';
    ctx.font = 'normal 68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Word wrap title
    const maxWidth = canvas.width - 160;
    const words = w.title.split(' ');
    let line = '';
    let y = 480;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), sealX, y);
        line = words[n] + ' ';
        y += 85;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), sealX, y);

    // 7. Couple's Names in Hand-lettered Calligraphy / Serif Italic
    y += 110;
    ctx.fillStyle = '#666e72';
    ctx.font = 'italic 46px serif';
    const coupleText = `${w.partnerOneName} ${w.partnerTwoName ? 'and ' + w.partnerTwoName : ''}`;
    ctx.fillText(coupleText, sealX, y);

    // 8. Divider with diamond ornament
    y += 90;
    ctx.strokeStyle = '#cacab0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, y);
    ctx.lineTo(sealX - 40, y);
    ctx.moveTo(sealX + 40, y);
    ctx.lineTo(canvas.width - 140, y);
    ctx.stroke();

    ctx.fillStyle = '#484036';
    ctx.beginPath();
    ctx.arc(sealX, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // 9. Stats Grid (RSVP Deadline & Households)
    y += 60;
    const deadlineDate = new Date(w.rsvpDeadline).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#666e72';
    ctx.font = '28px sans-serif';
    ctx.fillText('RSVP RESPONSE DEADLINE', sealX, y);

    ctx.fillStyle = '#33302c';
    ctx.font = '40px sans-serif';
    ctx.fillText(deadlineDate, sealX, y + 48);

    y += 150;
    ctx.fillStyle = '#666e72';
    ctx.font = '28px sans-serif';
    ctx.fillText('INVITED HOUSEHOLDS', sealX, y);

    ctx.fillStyle = '#33302c';
    ctx.font = '40px sans-serif';
    ctx.fillText(`${w._count?.households || 0} Families Enrolled`, sealX, y + 48);

    // 10. Footer CTA Bar
    ctx.fillStyle = '#ecece4';
    ctx.fillRect(60, canvas.height - 180, canvas.width - 120, 100);
    ctx.strokeStyle = '#666e72';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(60, canvas.height - 180, canvas.width - 120, 100);

    ctx.fillStyle = '#484036';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CLICK TO ENTER 3D WORKSPACE →', sealX, canvas.height - 130);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    return texture;
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = Math.min(Math.max(window.innerHeight * 0.75, 580), 820);

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaf5eb);
    scene.fog = new THREE.FogExp2(0xfaf5eb, 0.0006);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 4000);
    camera.position.set(0, 0, 1500);

    // 2. Renderer with High Performance & Color Management
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 3. Lighting Setup: Warm Earthen Atelier
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfef3c7, 2.2);
    mainSun.position.set(400, 800, 1000);
    scene.add(mainSun);

    const rimLight = new THREE.DirectionalLight(0xd97706, 0.8);
    rimLight.position.set(-600, -200, -800);
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(0xffedd5, 2.5, 1800);
    pointLight.position.set(0, 0, 1200);
    scene.add(pointLight);

    // 4. Curved 3D Cylinder Gallery Mesh Formation
    const cardMeshes: THREE.Mesh[] = [];
    const count = Math.max(weddings.length, 3);
    const radius = Math.max(count * 220, 1100);
    const cardWidth = 380;
    const cardHeight = 530;

    // Curved plane geometry for subtle physical curvature like thick parchment
    const cardGeometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 16, 16);

    // Add gentle convex curve along X
    const pos = cardGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, -Math.pow(x / (cardWidth / 2), 2) * 18);
    }
    cardGeometry.computeVertexNormals();

    const displayWeddings = weddings.length > 0 ? weddings : [
      {
        id: 'placeholder',
        title: 'Grand Atelier Royal Wedding',
        partnerOneName: 'Aarav',
        partnerTwoName: 'Ishita',
        rsvpDeadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        _count: { events: 3, households: 140 },
      },
    ];

    displayWeddings.forEach((w, i) => {
      const texture = createCardTexture(w, i);
      const material = new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2,
        reflectivity: 0.6,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(cardGeometry, material);

      // Distribute evenly along cylinder
      const angle = (i / displayWeddings.length) * Math.PI * 2;
      mesh.position.x = Math.sin(angle) * radius;
      mesh.position.z = Math.cos(angle) * radius - radius + 200;
      mesh.position.y = 0;
      mesh.rotation.y = angle + Math.PI;

      mesh.userData = {
        wedding: w,
        index: i,
        baseAngle: angle,
        baseY: 0,
        originalRadius: radius,
      };

      scene.add(mesh);
      cardMeshes.push(mesh);
    });

    // 5. Interactive 3D Gold Leaf & Marigold Petal Particle System
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color('#d97706');
    const saffronColor = new THREE.Color('#f59e0b');
    const boneColor = new THREE.Color('#cacab0');

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 3000;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 1600;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2200;

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
      particleVelocities[i * 3 + 1] = -Math.random() * 0.6 - 0.2; // drifting down
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      const pick = Math.random();
      const c = pick > 0.6 ? goldColor : pick > 0.3 ? saffronColor : boneColor;
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    // Particle sprite using procedural canvas circle
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d')!;
    const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    pGrad.addColorStop(0.4, 'rgba(255, 240, 200, 0.9)');
    pGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 64, 64);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 24,
      map: pTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Save Three context
    threeRef.current = {
      scene,
      camera,
      renderer,
      cardMeshes,
      particleSystem,
      particleVelocities,
      pointLight,
      mouse: new THREE.Vector2(-1000, -1000),
      raycaster: new THREE.Raycaster(),
      rotationTarget: 0,
      rotationCurrent: 0,
      targetCameraZ: 1500,
      reqId: 0,
      isDragging: false,
      dragStartX: 0,
      lastDragX: 0,
      dragVelocity: 0,
    };

    // 6. Animation Loop (Smooth Gyroscope + Damped Inertia)
    let clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();
      const state = threeRef.current;
      if (!state) return;

      // Auto-rotation when not dragging
      if (isAutoRotating && !state.isDragging) {
        state.rotationTarget += 0.0018;
      }

      // Inertial spring damping on cylinder rotation
      if (!state.isDragging && Math.abs(state.dragVelocity) > 0.0001) {
        state.rotationTarget += state.dragVelocity;
        state.dragVelocity *= 0.92;
      }

      state.rotationCurrent += (state.rotationTarget - state.rotationCurrent) * 0.08;

      // Position each card on the rotating 3D cylinder
      state.cardMeshes.forEach((mesh) => {
        const u = mesh.userData;
        const currentAngle = u.baseAngle + state.rotationCurrent;

        mesh.position.x = Math.sin(currentAngle) * u.originalRadius;
        mesh.position.z = Math.cos(currentAngle) * u.originalRadius - u.originalRadius + 200;
        mesh.rotation.y = currentAngle + Math.PI;

        // Subtle floating wave motion
        mesh.position.y = Math.sin(t * 1.5 + u.index) * 12;
      });

      // Animate floating particles
      const positions = state.particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += state.particleVelocities[i * 3] + Math.sin(t + i) * 0.3;
        positions[i * 3 + 1] += state.particleVelocities[i * 3 + 1];
        positions[i * 3 + 2] += state.particleVelocities[i * 3 + 2];

        // Wrap around boundaries
        if (positions[i * 3 + 1] < -800) {
          positions[i * 3 + 1] = 800;
        }
        if (positions[i * 3] > 1500) positions[i * 3] = -1500;
        if (positions[i * 3] < -1500) positions[i * 3] = 1500;
      }
      state.particleSystem.geometry.attributes.position.needsUpdate = true;

      // Raycasting for interactive hover lift and cursor tilt
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const intersects = state.raycaster.intersectObjects(state.cardMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const idx = hit.userData.index;

        if (hoveredIndex !== idx) {
          setHoveredIndex(idx);
          soundFx.playHoverChime(950 + idx * 80);
        }

        // Lift hovered card toward camera
        hit.position.z += 60;
        hit.scale.lerp(new THREE.Vector3(1.06, 1.06, 1.06), 0.15);

        // Dynamic point light tracks hover point
        state.pointLight.position.set(
          intersects[0].point.x,
          intersects[0].point.y,
          intersects[0].point.z + 180
        );
      } else {
        if (hoveredIndex !== null) {
          setHoveredIndex(null);
        }
        state.cardMeshes.forEach((mesh) => {
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        });
      }

      state.renderer.render(state.scene, state.camera);
      state.reqId = requestAnimationFrame(animate);
    };

    if (threeRef.current) {
      threeRef.current.reqId = requestAnimationFrame(animate);
    }

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = Math.min(Math.max(window.innerHeight * 0.75, 580), 820);
      threeRef.current.camera.aspect = newW / newH;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.reqId);
        threeRef.current.renderer.dispose();
      }
    };
  }, [weddings, isAutoRotating]);

  // Pointer event handlers for drag / touch interaction
  const onPointerDown = (e: React.PointerEvent) => {
    const state = threeRef.current;
    if (!state) return;

    state.isDragging = true;
    state.dragStartX = e.clientX;
    state.lastDragX = e.clientX;
    state.dragVelocity = 0;
    setIsInteracting(true);
    soundFx.playPaperRustle();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const state = threeRef.current;
    if (!state || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (state.isDragging) {
      const deltaX = e.clientX - state.lastDragX;
      state.lastDragX = e.clientX;
      const rotDelta = deltaX * 0.0035;
      state.rotationTarget += rotDelta;
      state.dragVelocity = rotDelta;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const state = threeRef.current;
    if (!state) return;

    // Check if it was a quick click rather than a drag
    const totalDistance = Math.abs(e.clientX - state.dragStartX);
    state.isDragging = false;
    setIsInteracting(false);

    if (totalDistance < 8) {
      // Raycast click
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const intersects = state.raycaster.intersectObjects(state.cardMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const wedding = hit.userData.wedding as WeddingItem;
        soundFx.playWaxSealCrack();
        setActiveWedding(wedding);
      }
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const state = threeRef.current;
    if (!state) return;
    state.rotationTarget += e.deltaY * 0.0012;
  };

  return (
    <div className="relative w-full rounded-[4px] border border-[#666e72]/30 bg-[#faf5eb] overflow-hidden select-none shadow-none">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        className="w-full h-[580px] sm:h-[660px] lg:h-[720px] cursor-grab active:cursor-grabbing block touch-none"
      />

      {/* Floating 3D Atelier HUD Bar */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#f2e9cf] border border-[#cacab0] text-[#484036] text-xs uppercase tracking-[0.05em] font-normal">
            <Sparkles size={14} className="text-[#484036]" />
            <span>WebGL 3D Atelier • Cylinder Curve</span>
          </span>
          <span className="hidden md:inline-block text-[11px] text-[#666e72] font-normal uppercase tracking-[0.05em]">
            Drag to rotate • Click card to unbox
          </span>
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-[4px] border transition-all text-xs flex items-center gap-1.5 ${
              isAutoRotating
                ? 'bg-[#484036] text-[#faf5eb] border-[#484036]'
                : 'bg-[#ecece4] text-[#484036] border-[#666e72]/30 hover:border-[#484036]'
            }`}
            title={isAutoRotating ? 'Pause rotation' : 'Resume auto-rotation'}
            aria-label="Toggle 3D auto rotation"
          >
            {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline uppercase tracking-[0.05em] text-[10px]">
              {isAutoRotating ? 'Spinning' : 'Paused'}
            </span>
          </button>

          <button
            onClick={toggleMute}
            className={`p-2 rounded-[4px] border transition-all text-xs ${
              !isMuted
                ? 'bg-[#ecece4] text-[#484036] border-[#666e72]/30 hover:border-[#484036]'
                : 'bg-[#faf5eb] text-[#666e72] border-[#666e72]/30'
            }`}
            title={isMuted ? 'Unmute tactile audio' : 'Mute tactile audio'}
            aria-label="Toggle 3D interaction audio"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Floating Instruction Pill on Bottom */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#ecece4]/90 backdrop-blur-xs border border-[#666e72]/30 text-xs text-[#484036] uppercase tracking-[0.05em]">
          <span>Rotate 3D Cylinder • Click any card for Royal Unboxing</span>
        </div>
      </div>

      {/* 3D Wax Seal Unboxing Modal / Action Sheet */}
      {activeWedding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#33302c]/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-[#faf5eb] rounded-[4px] border border-[#666e72] p-8 shadow-none relative animate-scale-up">
            {/* Header Tag */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#666e72]/20">
              <span className="text-xs uppercase tracking-[0.05em] px-3 py-1 rounded-[4px] bg-[#f2e9cf] text-[#484036] border border-[#cacab0]">
                Interactive 3D Workspace
              </span>
              <button
                onClick={() => setActiveWedding(null)}
                className="text-xs uppercase tracking-[0.05em] text-[#666e72] hover:text-[#33302c] px-3 py-1 rounded-[4px] border border-[#666e72]/30 hover:bg-[#ecece4]"
              >
                Close (ESC)
              </button>
            </div>

            {/* Wedding Title & Couple */}
            <h2 className="text-2xl sm:text-3xl font-normal text-[#33302c] tracking-[-0.04em] leading-tight">
              {activeWedding.title}
            </h2>
            <p className="text-sm font-serif italic text-[#484036]/80 mt-1.5">
              {activeWedding.partnerOneName} {activeWedding.partnerTwoName ? `& ${activeWedding.partnerTwoName}` : ''}
            </p>

            {/* Metrics Snapshot */}
            <div className="grid grid-cols-2 gap-3 my-6">
              <div className="p-4 rounded-[4px] bg-[#ecece4] border border-[#666e72]/25">
                <span className="text-[10px] uppercase tracking-[0.05em] text-[#666e72] block">
                  Functions & Ceremonies
                </span>
                <span className="text-xl font-normal text-[#33302c] tracking-[-0.03em] mt-1 block">
                  {activeWedding._count?.events || 1} Events
                </span>
              </div>
              <div className="p-4 rounded-[4px] bg-[#ecece4] border border-[#666e72]/25">
                <span className="text-[10px] uppercase tracking-[0.05em] text-[#666e72] block">
                  Guest Households
                </span>
                <span className="text-xl font-normal text-[#33302c] tracking-[-0.03em] mt-1 block">
                  {activeWedding._count?.households || 0} Families
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#666e72]/20">
              <button
                onClick={() => {
                  soundFx.playRoyalFanfare();
                  navigate(`/weddings/${activeWedding.id}`);
                }}
                className="w-full sm:flex-1 py-3 px-6 rounded-[4px] bg-[#484036] hover:bg-[#33302c] text-[#faf5eb] font-normal text-xs uppercase tracking-[0.05em] flex items-center justify-center gap-2 transition-colors"
              >
                <span>Enter Wedding Workspace</span>
                <ChevronRight size={15} />
              </button>

              <button
                onClick={() => {
                  soundFx.playRoyalFanfare();
                  navigate(`/weddings/${activeWedding.id}/guests`);
                }}
                className="w-full sm:w-auto py-3 px-5 rounded-[4px] border border-[#484036] text-[#484036] hover:bg-[#ecece4] font-normal text-xs uppercase tracking-[0.05em] transition-colors"
              >
                <span>Manage Guests</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
