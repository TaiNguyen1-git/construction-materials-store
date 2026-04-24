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
  showRoof?: boolean
}

function HouseModel({ onMeshClick, selectedMesh, buildingStyle, totalArea, roofType, rooms = [], showRoof = true }: HouseModelProps) {
  const isOneFloor = buildingStyle === 'nhà_cấp_4'
  const isFlatRoof = roofType === 'bê_tông'
  const isThaiRoof = roofType === 'mái_thái'
  
  const houseWidth = 6
  let currentZ = 0
  
  const houseElements = rooms.length > 0 ? rooms : [
      { name: 'Phòng khách', length: 6, width: 6, area: 36, height: 3.2 },
      { name: 'Phòng ngủ', length: 4, width: 6, area: 24, height: 3.2 }
  ]

  const totalLength = houseElements.reduce((acc, r) => acc + (r.length || 3), 0)
  const zOffset = totalLength / 2

  return (
    <group position={[0, 0, 0]}>
      {/* ── LANDSCAPE / ENVIRONMENT ── */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[totalLength, totalLength, 0.4, 64]} />
        <meshStandardMaterial color="#1e293b" roughness={1} />
      </mesh>
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[totalLength - 0.5, totalLength - 0.5, 0.45, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={1} />
      </mesh>

      {/* ── MAIN FOUNDATION ── */}
      <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[houseWidth + 0.4, 0.3, totalLength + 0.4]} />
        <meshStandardMaterial color="#334155" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* ── ROOMS GENERATION ── */}
      {houseElements.map((room, idx) => {
        const rLen = room.length || 3
        const rWidth = room.width || 6
        const rHeight = room.height || 3.2
        const roomZPos = currentZ + rLen / 2 - zOffset
        currentZ += rLen

        const isLastRoom = idx === houseElements.length - 1
        const isFirstRoom = idx === 0
        const roomColor = selectedMesh === `Sàn ${room.name}` ? '#6366f1' : '#cbd5e1'

        return (
          <group key={idx} position={[0, 0, roomZPos]}>
            {/* Floor Slab */}
            <mesh 
              position={[0, 0.05, 0]} 
              receiveShadow
              onClick={(e) => {
                e.stopPropagation()
                onMeshClick({ elementType: 'concrete_slab', name: `Sàn ${room.name}`, area: rLen * rWidth }, new THREE.Vector3(0, 0.1, roomZPos))
              }}
            >
              <boxGeometry args={[rWidth - 0.1, 0.1, rLen - 0.1]} />
              <meshStandardMaterial 
                color={roomColor} 
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>

            {/* Side Walls with Windows */}
            <group>
              {/* Left Wall Segment */}
              <mesh position={[-rWidth/2, rHeight/2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, rHeight, rLen]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
              </mesh>
              {/* Left Window Mock */}
              <mesh position={[-rWidth/2 + 0.11, rHeight/2 + 0.2, 0]}>
                <boxGeometry args={[0.02, 1.2, rLen * 0.6]} />
                <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} metalness={0.8} roughness={0.1} />
              </mesh>

              {/* Right Wall Segment */}
              <mesh position={[rWidth/2, rHeight/2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, rHeight, rLen]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
              </mesh>
              {/* Right Window Mock */}
              <mesh position={[rWidth/2 - 0.11, rHeight/2 + 0.2, 0]}>
                <boxGeometry args={[0.02, 1.2, rLen * 0.6]} />
                <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} metalness={0.8} roughness={0.1} />
              </mesh>
            </group>

            {/* Partition Wall with Door Hole (Simplified) */}
            {!isLastRoom && (
              <group position={[0, rHeight/2, rLen/2]}>
                {/* Wall Left of Door */}
                <mesh position={[-rWidth/4 - 0.5, 0, 0]} castShadow>
                   <boxGeometry args={[rWidth/2 - 1, rHeight, 0.2]} />
                   <meshStandardMaterial color="#f1f5f9" />
                </mesh>
                {/* Wall Right of Door */}
                <mesh position={[rWidth/4 + 0.5, 0, 0]} castShadow>
                   <boxGeometry args={[rWidth/2 - 1, rHeight, 0.2]} />
                   <meshStandardMaterial color="#f1f5f9" />
                </mesh>
                {/* Wall Above Door */}
                <mesh position={[0, rHeight/2 - 0.5, 0]} castShadow>
                   <boxGeometry args={[2, 1, 0.2]} />
                   <meshStandardMaterial color="#f1f5f9" />
                </mesh>
                
                {/* Door Frame Mock */}
                <mesh 
                  position={[0, -0.6, 0]} 
                  onClick={(e) => {
                    e.stopPropagation()
                    onMeshClick({ elementType: 'brick_wall', name: `Tường ngăn ${room.name}`, width: rWidth, height: rHeight, depth: 0.2 }, new THREE.Vector3(0, rHeight/2, roomZPos + rLen/2))
                  }}
                >
                  <boxGeometry args={[1, 2, 0.1]} />
                  <meshStandardMaterial color="#475569" roughness={0.9} />
                </mesh>
              </group>
            )}

            {/* Front Door (For the very first room) */}
            {isFirstRoom && (
                <group position={[0, rHeight/2, -rLen/2]}>
                    <mesh position={[0, -0.5, 0]}>
                        <boxGeometry args={[1.2, 2.2, 0.2]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.5} />
                    </mesh>
                </group>
            )}

            {/* Premium Room Label */}
            <Html position={[0, rHeight + 0.6, 0]} center distanceFactor={10}>
              <div className="group flex flex-col items-center gap-1 cursor-default select-none pointer-events-none">
                <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex items-center gap-2 transition-all group-hover:scale-110 group-hover:bg-white/20">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">
                    {room.name}
                  </span>
                </div>
                <div className="h-4 w-px bg-gradient-to-b from-white/40 to-transparent" />
              </div>
            </Html>
          </group>
        )
      })}

      {/* ── BACK EXTERIOR WALL ── */}
      <mesh position={[0, 1.6, zOffset]} castShadow>
        <boxGeometry args={[houseWidth, 3.2, 0.2]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>

      {/* ── ROOFING SYSTEM ── */}
      {showRoof && (
        <group position={[0, 3.2, 0]} castShadow>
          {isFlatRoof ? (
            <mesh position={[0, 0.15, 0]} castShadow>
              <boxGeometry args={[houseWidth + 0.8, 0.3, totalLength + 0.8]} />
              <meshStandardMaterial color="#475569" roughness={0.8} metalness={0.1} />
            </mesh>
          ) : (
            <mesh rotation={[0, 0, Math.PI / 4]} position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[houseWidth * 0.6, houseWidth * 1.3, totalLength + 1.2]} />
              <meshStandardMaterial 
                color={isThaiRoof ? '#991b1b' : '#334155'} 
                metalness={0.6} 
                roughness={0.2} 
              />
            </mesh>
          )}
        </group>
      )}

      {/* ── AMBIENT DETAILS ── */}
      <mesh position={[0, -0.15, totalLength/2 + 1]} receiveShadow>
          <boxGeometry args={[2, 0.05, 2]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
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
  const [showRoof, setShowRoof] = useState(true)

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
      {/* Control Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowRoof(!showRoof)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
            showRoof 
              ? 'bg-white text-slate-900 hover:bg-slate-100' 
              : 'bg-indigo-600 text-white shadow-indigo-500/40'
          }`}
        >
          {showRoof ? '🏠 Ẩn mái (Nhìn bên trong)' : '🏠 Hiện mái'}
        </button>
      </div>

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
            showRoof={showRoof}
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

