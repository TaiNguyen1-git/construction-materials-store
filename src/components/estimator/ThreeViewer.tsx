'use client'

import { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas, useLoader, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Html, useProgress } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { calculateBoQ, mergeBoQ, type MeshMetadata, type BoQResult } from '@/lib/tcvn-calculator'

import { RoomDimension } from '@/app/estimator/types'

// ============================================
// LOADER - Hiển thị trong khi model đang tải
// ============================================
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-bold text-sm">Đang tải mô hình 3D... {Math.round(progress)}%</p>
      </div>
    </Html>
  )
}

// ============================================
// HOUSE MODEL với raycasting + click detection
// ============================================
interface HouseModelProps {
  onMeshClick: (meta: MeshMetadata, position: THREE.Vector3) => void
  selectedMesh: string | null
  buildingStyle?: string
  totalArea?: number
  roofType?: string
  rooms?: RoomDimension[]
}

function HouseModel({ onMeshClick, selectedMesh, buildingStyle, totalArea, roofType, rooms = [] }: HouseModelProps) {
  const isOneFloor = buildingStyle === 'nhà_cấp_4'
  const isFlatRoof = roofType === 'bê_tông'
  const isThaiRoof = roofType === 'mái_thái'
  
  // Logic: Nếu có danh sách phòng, ta dựng Layout theo chiều dọc (Z-axis)
  // Chiều rộng mặc định 6m (theo bản vẽ 6x20)
  const houseWidth = 6
  let currentZ = 0
  
  const houseElements = rooms.length > 0 ? rooms : [
      { name: 'Phòng chính', length: 5, width: 6, area: 30, height: 3.2 }
  ]

  const totalLength = houseElements.reduce((acc, r) => acc + (r.length || 3), 0)
  const zOffset = totalLength / 2

  const getMeshColor = (key: string) => {
    if (selectedMesh === key) return '#6366f1'
    if (key.includes('Wall')) return '#e2e8f0'
    if (key.includes('Floor')) return '#94a3b8'
    return '#cbd5e1'
  }

  return (
    <group position={[0, 0, 0]}>
      {/* ── GROUND / FOUNDATION ── */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[houseWidth + 1, 0.4, totalLength + 1]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* ── ROOMS SEQUENCE (Dọc theo trục Z) ── */}
      {houseElements.map((room, idx) => {
        const rLen = room.length || 3
        const rWidth = room.width || 6
        const rHeight = room.height || 3.2
        const roomZPos = currentZ + rLen / 2 - zOffset
        currentZ += rLen

        const roomKey = `Room_${idx}`

        return (
          <group key={roomKey} position={[0, 0, roomZPos]}>
            {/* Floor for this specific room */}
            <mesh 
                position={[0, 0.05, 0]} 
                onClick={(e) => {
                    e.stopPropagation()
                    onMeshClick({ elementType: 'concrete_slab', name: `Sàn ${room.name}`, area: rLen * rWidth }, new THREE.Vector3(0, 0.1, roomZPos))
                }}
            >
              <boxGeometry args={[rWidth - 0.1, 0.1, rLen - 0.1]} />
              <meshStandardMaterial color={selectedMesh === `Sàn ${room.name}` ? '#6366f1' : '#94a3b8'} roughness={0.4} />
            </mesh>

            {/* Side Walls (Left & Right) */}
            <mesh position={[-rWidth/2, rHeight/2, 0]}>
              <boxGeometry args={[0.2, rHeight, rLen]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh position={[rWidth/2, rHeight/2, 0]}>
              <boxGeometry args={[0.2, rHeight, rLen]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>

            {/* Partition Wall (Back wall of each room) */}
            <mesh 
                position={[0, rHeight/2, rLen/2]}
                onClick={(e) => {
                    e.stopPropagation()
                    onMeshClick({ elementType: 'brick_wall', name: `Tường ${room.name}`, width: rWidth, height: rHeight, depth: 0.2 }, new THREE.Vector3(0, rHeight/2, roomZPos + rLen/2))
                }}
            >
              <boxGeometry args={[rWidth, rHeight, 0.2]} />
              <meshStandardMaterial color={selectedMesh === `Tường ${room.name}` ? '#6366f1' : '#f8fafc'} />
            </mesh>

            {/* Label for room */}
            <Html position={[0, rHeight + 0.5, 0]} center>
                <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/20 text-[8px] text-white font-bold whitespace-nowrap">
                    {room.name}
                </div>
            </Html>
          </group>
        )
      })}

      {/* ── EXTERIOR FRONT WALL ── */}
      <mesh position={[0, 1.6, -zOffset]}>
        <boxGeometry args={[houseWidth, 3.2, 0.2]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* ── ROOFING ── */}
      <group position={[0, 3.2, 0]}>
        {isFlatRoof ? (
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[houseWidth + 0.4, 0.2, totalLength + 0.4]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        ) : (
          <mesh rotation={[0, 0, Math.PI / 4]} position={[0, 1.2, 0]}>
            <boxGeometry args={[2.5, 7.5, totalLength + 1]} />
            <meshStandardMaterial color={isThaiRoof ? '#dc2626' : '#64748b'} metalness={0.6} roughness={0.3} />
          </mesh>
        )}
      </group>
    </group>
  )
}

// ============================================
// MAIN 3D VIEWER COMPONENT
// ============================================
interface ThreeViewerProps {
  onBoQChange: (results: BoQResult[]) => void
  buildingStyle?: string
  totalArea?: number
  roofType?: string
  rooms?: RoomDimension[]
}

export default function ThreeViewer({ onBoQChange, buildingStyle, totalArea, roofType, rooms = [] }: ThreeViewerProps) {
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null)
  const [collectedBoQ, setCollectedBoQ] = useState<BoQResult[]>([])
  const [lastClicked, setLastClicked] = useState<{ name: string; pos: [number, number] } | null>(null)

  const handleMeshClick = useCallback((meta: MeshMetadata, pos: THREE.Vector3) => {
    const boqResult = calculateBoQ(meta)
    
    setSelectedMesh(meta.name)
    setLastClicked({
      name: meta.name,
      pos: [0, 0], // Center placeholder
    })

    setCollectedBoQ(prev => {
      const exists = prev.find(r => r.elementName === meta.name)
      const next = exists
        ? prev.map(r => r.elementName === meta.name ? boqResult : r)
        : [...prev, boqResult]
      onBoQChange(next)
      return next
    })

    setTimeout(() => setLastClicked(null), 3000)
  }, [onBoQChange])

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [15, 12, 15], fov: 45 }}
        className="bg-gradient-to-b from-slate-900 to-slate-800"
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#6366f1" />
        
        <Suspense fallback={<Loader />}>
          <HouseModel 
            onMeshClick={handleMeshClick} 
            selectedMesh={selectedMesh} 
            buildingStyle={buildingStyle}
            totalArea={totalArea}
            roofType={roofType}
            rooms={rooms}
          />
          <Environment preset="city" />
        </Suspense>

        <Grid
          position={[0, -0.4, 0]}
          args={[40, 40]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#334155"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#475569"
          fadeDistance={40}
          fadeStrength={1}
          infiniteGrid
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Tooltip */}
      {lastClicked && (
        <div
          className="absolute pointer-events-none bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl animate-fade-in"
          style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}
        >
          ✅ Đã chọn: {lastClicked.name}
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full border border-white/10">
        🖱️ Click vào Tường hoặc Sàn của từng phòng để bóc tách vật liệu thực tế
      </div>
    </div>
  )
}

