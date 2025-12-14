/**
 * DNAHelixVisualizer
 *
 * Interactive 3D DNA double helix visualization for education.
 * Shows base pairing (A-T, G-C), major/minor grooves, sugar-phosphate backbone,
 * and 5' to 3' directionality. Features animatable unwinding for replication.
 *
 * Part of the Educational Layer epic (phage_explorer-2uo1).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTheme } from '../../hooks/useTheme';

// DNA base colors - distinct and colorblind-friendly
const BASE_COLORS: Record<string, string> = {
  A: '#22c55e', // Adenine - Green
  T: '#ef4444', // Thymine - Red
  G: '#3b82f6', // Guanine - Blue
  C: '#f59e0b', // Cytosine - Orange/Yellow
};

// Complementary base pairs
const BASE_PAIRS: Record<string, string> = {
  A: 'T',
  T: 'A',
  G: 'C',
  C: 'G',
};

// Base pair descriptions for education
const BASE_DESCRIPTIONS: Record<string, string> = {
  A: 'Adenine (A) - Purine base, pairs with Thymine via 2 hydrogen bonds',
  T: 'Thymine (T) - Pyrimidine base, pairs with Adenine via 2 hydrogen bonds',
  G: 'Guanine (G) - Purine base, pairs with Cytosine via 3 hydrogen bonds',
  C: 'Cytosine (C) - Pyrimidine base, pairs with Guanine via 3 hydrogen bonds',
};

// Backbone color
const BACKBONE_COLOR = '#9ca3af'; // Gray

// Bond colors
const HYDROGEN_BOND_COLOR = '#e5e7eb'; // Light gray for H-bonds

interface DNAHelixVisualizerProps {
  /** DNA sequence (5' to 3' direction), defaults to sample sequence */
  sequence?: string;
  /** Animation speed in milliseconds per rotation step */
  speedMs?: number;
  /** Whether to auto-rotate */
  autoRotate?: boolean;
  /** Title for accessibility */
  title?: string;
  /** Show unwinding animation for replication */
  showReplication?: boolean;
}

// Default educational sequence with all bases
const DEFAULT_SEQUENCE = 'ATGCGATCGAATCG';

// Helix parameters
const HELIX_RADIUS = 1.0; // Distance from center to backbone
const RISE_PER_BP = 0.34; // 3.4 Å per base pair (scaled)
const TWIST_ANGLE = (2 * Math.PI) / 10; // 36° per base pair (B-DNA)
const BASE_SPHERE_RADIUS = 0.15;
const BACKBONE_SPHERE_RADIUS = 0.12;
const BOND_RADIUS = 0.04;

function cleanSequence(seq: string | undefined): string {
  if (!seq) return DEFAULT_SEQUENCE;
  return seq.toUpperCase().replace(/[^ACGT]/g, '') || DEFAULT_SEQUENCE;
}

function disposeObject(obj: Mesh | Group): void {
  if (obj instanceof Mesh) {
    obj.geometry?.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m?.dispose?.());
      } else {
        (obj.material as MeshStandardMaterial).dispose?.();
      }
    }
  }
  if (obj instanceof Group) {
    obj.children.forEach(child => {
      if (child instanceof Mesh || child instanceof Group) {
        disposeObject(child);
      }
    });
  }
}

export function DNAHelixVisualizer({
  sequence,
  speedMs = 50,
  autoRotate = true,
  title = 'DNA Double Helix',
  showReplication = false,
}: DNAHelixVisualizerProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const helixGroupRef = useRef<Group | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(autoRotate);
  const [unwindAmount, setUnwindAmount] = useState(0); // 0-1 for unwinding animation
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [highlightedBp, setHighlightedBp] = useState<number | null>(null);

  const cleanedSequence = useMemo(() => cleanSequence(sequence), [sequence]);
  const basePairs = useMemo(() => {
    return cleanedSequence.split('').map((base, i) => ({
      base5to3: base,
      base3to5: BASE_PAIRS[base] ?? 'N',
      index: i,
    }));
  }, [cleanedSequence]);

  // Build the 3D helix geometry
  const buildHelix = useCallback((scene: Scene, unwinding: number = 0): Group => {
    const group = new Group();
    const bpCount = basePairs.length;

    // Materials
    const backboneMaterial = new MeshStandardMaterial({
      color: new Color(BACKBONE_COLOR),
      roughness: 0.5,
      metalness: 0.2,
    });

    const hBondMaterial = new MeshStandardMaterial({
      color: new Color(HYDROGEN_BOND_COLOR),
      roughness: 0.8,
      transparent: true,
      opacity: 0.7,
    });

    // Reusable geometries
    const backboneSphereGeo = new SphereGeometry(BACKBONE_SPHERE_RADIUS, 16, 12);
    const baseSphereGeo = new SphereGeometry(BASE_SPHERE_RADIUS, 16, 12);
    const bondGeo = new CylinderGeometry(BOND_RADIUS, BOND_RADIUS, 1, 8);

    // Center the helix vertically
    const totalHeight = (bpCount - 1) * RISE_PER_BP;
    const yOffset = -totalHeight / 2;

    for (let i = 0; i < bpCount; i++) {
      const bp = basePairs[i];
      const y = i * RISE_PER_BP + yOffset;
      const angle = i * TWIST_ANGLE;

      // Unwinding effect: separate strands as unwinding increases
      const unwindOffset = unwinding * HELIX_RADIUS * 0.5;
      const unwindAngleOffset = unwinding * Math.PI * 0.3;

      // 5' to 3' strand (leading strand)
      const angle5to3 = angle + unwindAngleOffset;
      const x1 = Math.cos(angle5to3) * (HELIX_RADIUS + unwindOffset);
      const z1 = Math.sin(angle5to3) * (HELIX_RADIUS + unwindOffset);

      // 3' to 5' strand (complementary, anti-parallel)
      const angle3to5 = angle + Math.PI - unwindAngleOffset;
      const x2 = Math.cos(angle3to5) * (HELIX_RADIUS + unwindOffset);
      const z2 = Math.sin(angle3to5) * (HELIX_RADIUS + unwindOffset);

      // Backbone spheres (sugar-phosphate)
      const backbone1 = new Mesh(backboneSphereGeo, backboneMaterial.clone());
      backbone1.position.set(x1, y, z1);
      backbone1.userData = { type: 'backbone', strand: '5to3', index: i };
      group.add(backbone1);

      const backbone2 = new Mesh(backboneSphereGeo, backboneMaterial.clone());
      backbone2.position.set(x2, y, z2);
      backbone2.userData = { type: 'backbone', strand: '3to5', index: i };
      group.add(backbone2);

      // Base spheres (nucleotides)
      const baseMaterial1 = new MeshStandardMaterial({
        color: new Color(BASE_COLORS[bp.base5to3] ?? '#666'),
        roughness: 0.4,
        metalness: 0.1,
        emissive: new Color(BASE_COLORS[bp.base5to3] ?? '#666'),
        emissiveIntensity: highlightedBp === i ? 0.3 : 0.05,
      });

      const baseMaterial2 = new MeshStandardMaterial({
        color: new Color(BASE_COLORS[bp.base3to5] ?? '#666'),
        roughness: 0.4,
        metalness: 0.1,
        emissive: new Color(BASE_COLORS[bp.base3to5] ?? '#666'),
        emissiveIntensity: highlightedBp === i ? 0.3 : 0.05,
      });

      // Position bases between backbone and center
      const baseRadius = HELIX_RADIUS * 0.5;
      const bx1 = Math.cos(angle5to3) * (baseRadius + unwindOffset * 0.5);
      const bz1 = Math.sin(angle5to3) * (baseRadius + unwindOffset * 0.5);
      const bx2 = Math.cos(angle3to5) * (baseRadius + unwindOffset * 0.5);
      const bz2 = Math.sin(angle3to5) * (baseRadius + unwindOffset * 0.5);

      const base1 = new Mesh(baseSphereGeo, baseMaterial1);
      base1.position.set(bx1, y, bz1);
      base1.userData = { type: 'base', base: bp.base5to3, strand: '5to3', index: i };
      group.add(base1);

      const base2 = new Mesh(baseSphereGeo, baseMaterial2);
      base2.position.set(bx2, y, bz2);
      base2.userData = { type: 'base', base: bp.base3to5, strand: '3to5', index: i };
      group.add(base2);

      // Backbone-to-base bonds
      const bond1 = createBond(
        new Vector3(x1, y, z1),
        new Vector3(bx1, y, bz1),
        backboneMaterial.clone()
      );
      group.add(bond1);

      const bond2 = createBond(
        new Vector3(x2, y, z2),
        new Vector3(bx2, y, bz2),
        backboneMaterial.clone()
      );
      group.add(bond2);

      // Hydrogen bonds between base pairs (only when not fully unwound)
      if (unwinding < 0.8) {
        const hBond = createBond(
          new Vector3(bx1, y, bz1),
          new Vector3(bx2, y, bz2),
          hBondMaterial.clone()
        );
        hBond.userData = { type: 'hbond', index: i };
        group.add(hBond);
      }

      // Backbone connections to next nucleotide
      if (i < bpCount - 1) {
        const nextAngle = (i + 1) * TWIST_ANGLE;
        const nextY = (i + 1) * RISE_PER_BP + yOffset;

        const nextAngle5to3 = nextAngle + unwindAngleOffset;
        const nx1 = Math.cos(nextAngle5to3) * (HELIX_RADIUS + unwindOffset);
        const nz1 = Math.sin(nextAngle5to3) * (HELIX_RADIUS + unwindOffset);

        const nextAngle3to5 = nextAngle + Math.PI - unwindAngleOffset;
        const nx2 = Math.cos(nextAngle3to5) * (HELIX_RADIUS + unwindOffset);
        const nz2 = Math.sin(nextAngle3to5) * (HELIX_RADIUS + unwindOffset);

        const backboneBond1 = createBond(
          new Vector3(x1, y, z1),
          new Vector3(nx1, nextY, nz1),
          backboneMaterial.clone()
        );
        backboneBond1.userData = { type: 'backbone-bond', strand: '5to3' };
        group.add(backboneBond1);

        const backboneBond2 = createBond(
          new Vector3(x2, y, z2),
          new Vector3(nx2, nextY, nz2),
          backboneMaterial.clone()
        );
        backboneBond2.userData = { type: 'backbone-bond', strand: '3to5' };
        group.add(backboneBond2);
      }
    }

    // Clean up temporary geometries
    backboneSphereGeo.dispose();
    baseSphereGeo.dispose();
    bondGeo.dispose();

    return group;
  }, [basePairs, highlightedBp]);

  // Helper to create a bond (cylinder) between two points
  function createBond(start: Vector3, end: Vector3, material: MeshStandardMaterial): Mesh {
    const direction = new Vector3().subVectors(end, start);
    const length = direction.length();
    const geometry = new CylinderGeometry(BOND_RADIUS, BOND_RADIUS, length, 8);

    const mesh = new Mesh(geometry, material);
    mesh.position.copy(start).add(direction.multiplyScalar(0.5));

    // Orient cylinder along the bond direction
    const up = new Vector3(0, 1, 0);
    const axis = new Vector3().crossVectors(up, direction.normalize()).normalize();
    const angle = Math.acos(up.dot(direction.normalize()));
    if (axis.length() > 0.001) {
      mesh.quaternion.setFromAxisAngle(axis, angle);
    }

    return mesh;
  }

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new Scene();
    scene.background = new Color(colors.background);
    sceneRef.current = scene;

    // Camera
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(4, 2, 4);
    cameraRef.current = camera;

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controlsRef.current = controls;

    // Lighting
    const ambient = new AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0x88aaff, 0.4);
    fillLight.position.set(-3, 2, -3);
    scene.add(fillLight);

    // Initial helix
    const helix = buildHelix(scene, unwindAmount);
    helixGroupRef.current = helix;
    scene.add(helix);

    // Resize handler
    const resize = () => {
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 300;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Render loop
    const tick = (now: number) => {
      animationRef.current = requestAnimationFrame(tick);

      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying && helixGroupRef.current) {
        // speedMs controls rotation: lower values = faster rotation
        const rotationSpeed = 0.5 * (100 / Math.max(10, speedMs));
        helixGroupRef.current.rotation.y += rotationSpeed * delta;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (helixGroupRef.current) {
        disposeObject(helixGroupRef.current);
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      helixGroupRef.current = null;
    };
  }, [colors.background, isPlaying, speedMs]);

  // Rebuild helix when unwinding changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old helix
    if (helixGroupRef.current) {
      scene.remove(helixGroupRef.current);
      disposeObject(helixGroupRef.current);
    }

    // Build new helix
    const helix = buildHelix(scene, unwindAmount);
    helixGroupRef.current = helix;
    scene.add(helix);
  }, [buildHelix, unwindAmount]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Step rotation
  const stepRotation = useCallback(() => {
    if (helixGroupRef.current) {
      helixGroupRef.current.rotation.y += Math.PI / 8;
    }
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(4, 2, 4);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    if (helixGroupRef.current) {
      helixGroupRef.current.rotation.set(0, 0, 0);
    }
    setUnwindAmount(0);
  }, []);

  return (
    <div
      className="dna-helix-viz"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem',
        background: colors.backgroundAlt,
        borderRadius: '8px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <p style={{ color: colors.textDim, margin: 0, fontSize: '0.85rem' }}>{title}</p>
          <p style={{ color: colors.text, margin: 0, fontWeight: 500 }}>
            B-DNA Double Helix Structure
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }} role="group" aria-label="Playback controls">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={togglePlay}
            aria-pressed={isPlaying}
            style={{
              padding: '0.5rem 1rem',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '4px',
              background: 'transparent',
              color: colors.text,
              cursor: 'pointer',
            }}
          >
            {isPlaying ? 'Pause' : 'Rotate'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={stepRotation}
            style={{
              padding: '0.5rem 1rem',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '4px',
              background: 'transparent',
              color: colors.text,
              cursor: 'pointer',
            }}
          >
            Step
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={resetView}
            style={{
              padding: '0.5rem 1rem',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '4px',
              background: 'transparent',
              color: colors.text,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '6px',
          overflow: 'hidden',
          background: colors.background,
        }}
        role="img"
        aria-label="Interactive 3D DNA double helix visualization"
      />

      {/* Unwinding slider for replication demo */}
      {showReplication && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.5rem 0',
          }}
        >
          <label
            htmlFor="unwind-slider"
            style={{ color: colors.textDim, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            DNA Unwinding:
          </label>
          <input
            id="unwind-slider"
            type="range"
            min="0"
            max="100"
            value={unwindAmount * 100}
            onChange={(e) => setUnwindAmount(Number(e.target.value) / 100)}
            style={{ flex: 1 }}
            aria-label="Control DNA strand separation for replication visualization"
          />
          <span style={{ color: colors.text, fontSize: '0.85rem', minWidth: '3rem' }}>
            {Math.round(unwindAmount * 100)}%
          </span>
        </div>
      )}

      {/* Sequence display */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.75rem',
          background: colors.background,
          borderRadius: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: colors.textDim, fontSize: '0.75rem', width: '40px' }}>5'→3'</span>
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {basePairs.map((bp, i) => (
              <span
                key={`5-${i}`}
                style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: BASE_COLORS[bp.base5to3],
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  opacity: highlightedBp === i ? 1 : 0.8,
                  transform: highlightedBp === i ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={() => setHighlightedBp(i)}
                onMouseLeave={() => setHighlightedBp(null)}
                onClick={() => setSelectedBase(bp.base5to3)}
                title={BASE_DESCRIPTIONS[bp.base5to3]}
              >
                {bp.base5to3}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: colors.textDim, fontSize: '0.75rem', width: '40px' }}>3'←5'</span>
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {basePairs.map((bp, i) => (
              <span
                key={`3-${i}`}
                style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: BASE_COLORS[bp.base3to5],
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  opacity: highlightedBp === i ? 1 : 0.8,
                  transform: highlightedBp === i ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={() => setHighlightedBp(i)}
                onMouseLeave={() => setHighlightedBp(null)}
                onClick={() => setSelectedBase(bp.base3to5)}
                title={BASE_DESCRIPTIONS[bp.base3to5]}
              >
                {bp.base3to5}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
        }}
      >
        {Object.entries(BASE_COLORS).map(([base, color]) => (
          <div
            key={base}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedBase(base)}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                background: color,
                borderRadius: '2px',
              }}
            />
            <span style={{ color: colors.text }}>
              {base} - {base === 'A' ? 'Adenine' : base === 'T' ? 'Thymine' : base === 'G' ? 'Guanine' : 'Cytosine'}
            </span>
          </div>
        ))}
      </div>

      {/* Selected base info */}
      {selectedBase && (
        <div
          style={{
            padding: '0.75rem',
            background: colors.background,
            borderLeft: `3px solid ${BASE_COLORS[selectedBase]}`,
            borderRadius: '0 4px 4px 0',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ fontWeight: 500, color: colors.text, marginBottom: '0.25rem' }}>
            {selectedBase === 'A' ? 'Adenine (A)' : selectedBase === 'T' ? 'Thymine (T)' : selectedBase === 'G' ? 'Guanine (G)' : 'Cytosine (C)'}
          </div>
          <div style={{ color: colors.textDim }}>
            {BASE_DESCRIPTIONS[selectedBase]}
          </div>
          <button
            type="button"
            onClick={() => setSelectedBase(null)}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              border: 'none',
              background: colors.backgroundAlt,
              color: colors.textMuted,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Educational notes */}
      <div
        style={{
          padding: '0.75rem',
          background: colors.background,
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: colors.textDim,
        }}
      >
        <strong style={{ color: colors.accent }}>Key Concepts:</strong>
        <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
          <li><strong>Base Pairing:</strong> A pairs with T (2 H-bonds), G pairs with C (3 H-bonds)</li>
          <li><strong>Anti-parallel:</strong> The two strands run in opposite directions (5'→3' and 3'→5')</li>
          <li><strong>Right-handed helix:</strong> B-DNA winds clockwise when viewed from above</li>
          <li><strong>Major/Minor Grooves:</strong> Asymmetric spacing allows protein binding</li>
        </ul>
      </div>
    </div>
  );
}

export default DNAHelixVisualizer;
