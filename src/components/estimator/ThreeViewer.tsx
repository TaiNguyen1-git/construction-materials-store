'use client'

import { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas, useLoader, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Html, useProgress, Bounds, ContactShadows } from '@react-three/drei'
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
      <div className="flex flex-col items-center gap-3 p-8 bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-black text-xs uppercase tracking-widest whitespace-nowrap">
          Đang dựng BIM... {Math.round(progress)}%
        </p>
      </div>
    </Html>
  )
}

// ============================================
// HOUSE MODEL code...
// ============================================
interface HouseModelProps {
  onMeshClick: (meta: MeshMetadata, position: THREE.Vector3) => void
  selectedMesh: string | null
  buildingStyle?: string
  totalArea?: number
  roofType?: string
  rooms?: RoomDimension[]
  showRoof?: boolean
  wallHeightMode?: 'full' | 'cut'
}

function HouseModel({ onMeshClick, selectedMesh, buildingStyle, totalArea, roofType, rooms = [], showRoof = true, wallHeightMode = 'full' }: HouseModelProps) {
  const isFlatRoof = roofType === 'bê_tông'
  const isThaiRoof = roofType === 'mái_thái'
  
  const houseElements = rooms.length > 0 ? rooms : [
      { name: 'Phòng khách', length: 6, width: 6, area: 36, x: 0, z: 0, height: 3.2 },
      { name: 'Phòng ngủ', length: 4, width: 6, area: 24, x: 0, z: 5, height: 3.2 }
  ]

  // Tinh toán Bounding Box để dựng nền đất
  const bounds = houseElements.reduce((acc, r) => {
    const x = r.x || 0
    const z = r.z || 0
    const halfW = (r.width || 6) / 2
    const halfL = (r.length || 3) / 2
    return {
      minX: Math.min(acc.minX, x - halfW),
      maxX: Math.max(acc.maxX, x + halfW),
      minZ: Math.min(acc.minZ, z - halfL),
      maxZ: Math.max(acc.maxZ, z + halfL)
    }
  }, { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity })

  const houseWidth = bounds.maxX - bounds.minX
  const houseLength = bounds.maxZ - bounds.minZ
  const centerX = (bounds.maxX + bounds.minX) / 2
  const centerZ = (bounds.maxZ + bounds.minZ) / 2

  // Hàm kiểm tra xem có phòng lân cận không để gộp tường
  const hasNeighbor = (x: number, z: number, dir: 'left' | 'right' | 'front' | 'back', rW: number, rL: number) => {
    const threshold = 0.5
    return houseElements.some(r => {
      if (r.x === x && r.z === z) return false
      const nx = r.x || 0
      const nz = r.z || 0
      const nW = r.width || 6
      const nL = r.length || 3
      
      if (dir === 'left') return Math.abs(nx + nW/2 - (x - rW/2)) < threshold && Math.abs(nz - z) < (rL + nL)/2
      if (dir === 'right') return Math.abs(nx - nW/2 - (x + rW/2)) < threshold && Math.abs(nz - z) < (rL + nL)/2
      if (dir === 'front') return Math.abs(nz + nL/2 - (z - rL/2)) < threshold && Math.abs(nx - x) < (rW + nW)/2
      if (dir === 'back') return Math.abs(nz - nL/2 - (z + rL/2)) < threshold && Math.abs(nx - x) < (rW + nW)/2
      return false
    })
  }

  return (
    <group position={[-centerX, 0, -centerZ]}>
      {/* ── GROUND ── */}
      <mesh position={[centerX, -0.4, centerZ]} receiveShadow>
        <cylinderGeometry args={[houseLength * 2, houseLength * 2, 0.4, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={1} />
      </mesh>

      {/* ── ROOMS GENERATION ── */}
      {houseElements.map((room, idx) => {
        const rLen = room.length || 3
        const rWidth = room.width || 6
        const rHeight = wallHeightMode === 'cut' ? 0.5 : (room.height || 3.2)
        const x = room.x || 0
        const z = room.z || 0
        
        const roomColor = selectedMesh === `Sàn ${room.name}` ? '#6366f1' : '#cbd5e1'
        const wallOpacity = wallHeightMode === 'cut' ? 0.4 : 1

        return (
          <group key={idx} position={[x, 0, z]}>
            {/* Floor Slab */}
            <mesh 
              position={[0, 0.05, 0]} 
              receiveShadow
              onClick={(e) => {
                e.stopPropagation()
                onMeshClick({ elementType: 'concrete_slab', name: `Sàn ${room.name}`, area: rLen * rWidth }, new THREE.Vector3(x, 0.1, z))
              }}
            >
              <boxGeometry args={[rWidth, 0.1, rLen]} />
              <meshStandardMaterial color={roomColor} roughness={0.3} />
            </mesh>

            {/* Foundation Block */}
            <mesh position={[0, -0.1, 0]} receiveShadow>
                <boxGeometry args={[rWidth + 0.1, 0.2, rLen + 0.1]} />
                <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Walls - Only render if no neighbor */}
            {!hasNeighbor(x, z, 'left', rWidth, rLen) && (
                <mesh position={[-rWidth/2, rHeight/2, 0]} castShadow>
                    <boxGeometry args={[0.2, rHeight, rLen]} />
                    <meshStandardMaterial color="#f8fafc" transparent={wallHeightMode === 'cut'} opacity={wallOpacity} />
                </mesh>
            )}
            {!hasNeighbor(x, z, 'right', rWidth, rLen) && (
                <mesh position={[rWidth/2, rHeight/2, 0]} castShadow>
                    <boxGeometry args={[0.2, rHeight, rLen]} />
                    <meshStandardMaterial color="#f8fafc" transparent={wallHeightMode === 'cut'} opacity={wallOpacity} />
                </mesh>
            )}
            {!hasNeighbor(x, z, 'front', rWidth, rLen) && (
                <mesh position={[0, rHeight/2, -rLen/2]} castShadow>
                    <boxGeometry args={[rWidth, rHeight, 0.2]} />
                    <meshStandardMaterial color="#f1f5f9" transparent={wallHeightMode === 'cut'} opacity={wallOpacity} />
                </mesh>
            )}
            {!hasNeighbor(x, z, 'back', rWidth, rLen) && (
                <mesh position={[0, rHeight/2, rLen/2]} castShadow>
                    <boxGeometry args={[rWidth, rHeight, 0.2]} />
                    <meshStandardMaterial color="#f1f5f9" transparent={wallHeightMode === 'cut'} opacity={wallOpacity} />
                </mesh>
            )}

            {/* Compound Roof Segment */}
            {showRoof && (
                <group position={[0, rHeight, 0]}>
                    {isFlatRoof ? (
                        <mesh position={[0, 0.1, 0]} castShadow>
                            <boxGeometry args={[rWidth + 0.4, 0.2, rLen + 0.4]} />
                            <meshStandardMaterial color="#475569" />
                        </mesh>
                    ) : (
                        <mesh rotation={[0, 0, Math.PI / 4]} position={[0, rWidth/4, 0]} castShadow>
                            <boxGeometry args={[rWidth * 0.7, rWidth * 0.7, rLen + 0.2]} />
                            <meshStandardMaterial color={isThaiRoof ? '#991b1b' : '#334155'} metalness={0.5} roughness={0.2} />
                        </mesh>
                    )}
                </group>
            )}

            {/* Premium Label */}
            <Html position={[0, rHeight + 0.8, 0]} center distanceFactor={12}>
              <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-xl">
                <span className="text-[9px] font-black text-white uppercase tracking-tighter">
                  {room.name}
                </span>
              </div>
            </Html>
          </group>
        )
      })}
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
  const [wallHeightMode, setWallHeightMode] = useState<'full' | 'cut'>('full')

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
          {showRoof ? '🏠 Ẩn mái' : '🏠 Hiện mái'}
        </button>
        <button
          onClick={() => setWallHeightMode(wallHeightMode === 'full' ? 'cut' : 'full')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
            wallHeightMode === 'cut' 
              ? 'bg-orange-500 text-white shadow-orange-500/40' 
              : 'bg-white text-slate-900 hover:bg-slate-100'
          }`}
        >
          {wallHeightMode === 'full' ? '🧱 Chế độ Mặt bằng (Cắt tường)' : '🧱 Hiện đủ tường'}
        </button>
      </div>

      <Canvas
        camera={{ position: [25, 20, 25], fov: 40 }}
        className="bg-gradient-to-b from-slate-950 to-slate-900"
        shadows
      >
        <ambientLight intensity={0.4} />
        <spotLight position={[20, 20, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#6366f1" />
        
        <Suspense fallback={<Loader />}>
          <Bounds fit clip observe margin={1.2}>
            <HouseModel 
              onMeshClick={handleMeshClick} 
              selectedMesh={selectedMesh} 
              buildingStyle={buildingStyle}
              totalArea={totalArea}
              roofType={roofType}
              rooms={rooms}
              showRoof={showRoof}
              wallHeightMode={wallHeightMode}
            />
          </Bounds>
          <ContactShadows position={[0, -0.4, 0]} opacity={0.4} scale={40} blur={2} far={4} />
          <Environment preset="city" />
        </Suspense>

        <Grid
          position={[0, -0.41, 0]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={1}
          cellColor="#1e293b"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#334155"
          fadeDistance={50}
          fadeStrength={1}
          infiniteGrid
        />

        <OrbitControls
          makeDefault
          minDistance={5}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.1}
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

