import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundFx } from '../../lib/audioSynthesizer';
import { Sparkles, HeartHandshake, ChevronDown, Check } from 'lucide-react';

interface Royal3DInvitationCardProps {
  coupleTitle: string;
  householdName: string;
  eventCount: number;
  onOpenInvite: () => void;
  isOpened: boolean;
}

export const Royal3DInvitationCard: React.FC<Royal3DInvitationCardProps> = ({
  coupleTitle,
  householdName,
  eventCount,
  onOpenInvite,
  isOpened,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = Math.min(Math.max(window.innerHeight * 0.55, 380), 520);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaf5eb);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
    camera.position.set(0, 0, 420);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Warm Lighting
    const amb = new THREE.AmbientLight(0xfff7ed, 1.8);
    scene.add(amb);

    const sun = new THREE.DirectionalLight(0xfef3c7, 2.5);
    sun.position.set(200, 400, 300);
    scene.add(sun);

    const specularLight = new THREE.PointLight(0xffedd5, 2.0, 600);
    specularLight.position.set(0, 0, 300);
    scene.add(specularLight);

    // Card Envelope 3D Mesh
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 800;
    cardCanvas.height = 1000;
    const ctx = cardCanvas.getContext('2d')!;

    // Earthen Deckle Paper texture
    ctx.fillStyle = '#faf5eb';
    ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

    ctx.strokeStyle = '#484036';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, cardCanvas.width - 60, cardCanvas.height - 60);

    ctx.strokeStyle = '#cacab0';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, cardCanvas.width - 90, cardCanvas.height - 90);

    // Monogram & Wax Seal
    const sX = cardCanvas.width / 2;
    const sY = 280;
    const sR = 85;

    const grad = ctx.createRadialGradient(sX - 20, sY - 20, 10, sX, sY, sR);
    grad.addColorStop(0, '#e5be85');
    grad.addColorStop(0.6, '#b97b39');
    grad.addColorStop(1, '#694119');

    ctx.save();
    ctx.beginPath();
    ctx.arc(sX, sY, sR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(72, 64, 54, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    ctx.fillStyle = '#faf5eb';
    ctx.font = 'italic bold 56px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RSVP', sX, sY);
    ctx.restore();

    // Text: Welcome Household
    ctx.fillStyle = '#666e72';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CORDIALLY INVITING', sX, 440);

    ctx.fillStyle = '#33302c';
    ctx.font = 'bold 50px serif';
    ctx.fillText(householdName || 'Honored Guests', sX, 510);

    ctx.fillStyle = '#484036';
    ctx.font = 'italic 34px serif';
    ctx.fillText('to celebrate the sacred union of', sX, 580);

    ctx.fillStyle = '#33302c';
    ctx.font = 'normal 56px sans-serif';
    ctx.fillText(coupleTitle || 'Wedding Celebration', sX, 660);

    ctx.fillStyle = '#f2e9cf';
    ctx.fillRect(150, 750, cardCanvas.width - 300, 70);
    ctx.strokeStyle = '#cacab0';
    ctx.lineWidth = 2;
    ctx.strokeRect(150, 750, cardCanvas.width - 300, 70);

    ctx.fillStyle = '#484036';
    ctx.font = '26px sans-serif';
    ctx.fillText(`FEATURING ${eventCount} CEREMONIES & RECEPTIONS`, sX, 792);

    ctx.fillStyle = '#666e72';
    ctx.font = '24px sans-serif';
    ctx.fillText('TAP TO UNSEAL & CONFIRM ATTENDANCE', sX, 890);

    const texture = new THREE.CanvasTexture(cardCanvas);
    const cardGeo = new THREE.PlaneGeometry(190, 240, 32, 32);

    // Give card physical flex
    const pos = cardGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, -Math.pow(x / 95, 2) * 5 - Math.pow(y / 120, 2) * 4);
    }
    cardGeo.computeVertexNormals();

    const cardMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.4,
      reflectivity: 0.7,
      side: THREE.DoubleSide,
    });

    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    scene.add(cardMesh);

    // Floating Particles
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 400;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xd97706,
      size: 4,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let targetRotX = 0;
    let targetRotY = 0;
    let reqId = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      targetRotY = x * 0.45;
      targetRotX = -y * 0.45;

      specularLight.position.x = x * 150;
      specularLight.position.y = y * 150;
    };

    window.addEventListener('pointermove', handlePointerMove);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      // Gyroscopic tilt towards cursor with spring damping
      cardMesh.rotation.y += (targetRotY - cardMesh.rotation.y) * 0.08;
      cardMesh.rotation.x += (targetRotX - cardMesh.rotation.x) * 0.08;

      // Gentle floating hover
      cardMesh.position.y = Math.sin(t * 2) * 6;

      // Particle drift
      const pArr = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pCount; i++) {
        pArr[i * 3 + 1] -= 0.3;
        if (pArr[i * 3 + 1] < -200) pArr[i * 3 + 1] = 200;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      reqId = requestAnimationFrame(animate);
    };

    reqId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [coupleTitle, householdName, eventCount]);

  const handleClick = () => {
    soundFx.playWaxSealCrack();
    setHasInteracted(true);
    onOpenInvite();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto my-6 text-center select-none"
    >
      <div
        onClick={handleClick}
        className="cursor-pointer group relative rounded-[4px] border border-[#666e72]/30 bg-[#faf5eb] p-2 hover:border-[#484036] transition-all"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-[380px] sm:h-[460px] block rounded-[2px]"
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button
            type="button"
            className="px-6 py-2.5 rounded-[4px] bg-[#484036] text-[#faf5eb] text-xs font-normal uppercase tracking-[0.05em] group-hover:bg-[#33302c] shadow-none transition-all flex items-center gap-2"
          >
            <Sparkles size={14} />
            <span>Break Seal & Open RSVP</span>
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#666e72] font-normal uppercase tracking-[0.05em] mt-3">
        Move your mouse or tilt phone to rotate the royal 3D invitation card
      </p>
    </div>
  );
};
