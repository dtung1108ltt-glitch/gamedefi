import React from 'react';
import * as THREE from 'three';

/**
 * Historical War Flag with Vertical Pole standing 90° upright
 */
const UprightBanner: React.FC<{
  position: [number, number, number];
  text: string;
  subText?: string;
  bannerColor: string;
  goldTrim?: boolean;
}> = ({ position, text, subText, bannerColor, goldTrim = true }) => {
  return (
    <group position={position}>
      {/* Wooden Mast */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 4.0, 8]} />
        <meshStandardMaterial color="#4a301a" roughness={0.8} />
      </mesh>
      {/* Spear tip on flag top */}
      <mesh position={[0, 4.08, 0]}>
        <coneGeometry args={[0.08, 0.22, 6]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Cloth Flag Pennant */}
      <mesh position={[0.65, 3.2, 0]} castShadow>
        <planeGeometry args={[1.2, 1.4]} />
        <meshStandardMaterial
          color={bannerColor}
          side={THREE.DoubleSide}
          roughness={0.6}
        />
      </mesh>
      {/* Gold Trim Border */}
      {goldTrim && (
        <mesh position={[0.65, 3.2, 0.005]}>
          <planeGeometry args={[1.22, 1.42]} />
          <meshBasicMaterial color="#f59e0b" wireframe />
        </mesh>
      )}
    </group>
  );
};

/**
 * Đại Việt Royal Flagship (Chiến thuyền / Soái thuyền Đại Việt)
 */
const DaiVietWarJunk: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({
  position,
  rotationY = 0,
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Wooden Hull */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.2, 0.6, 3.4]} />
        <meshStandardMaterial color="#54371f" roughness={0.85} />
      </mesh>
      {/* Tapered Bow (Mũi thuyền rồng) */}
      <mesh position={[0, 0.35, 1.9]} rotation={[0.4, 0, 0]} castShadow>
        <coneGeometry args={[0.55, 0.9, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      {/* Dragon Head Prow Ornament */}
      <mesh position={[0, 0.7, 2.2]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Cabin / Command Deck */}
      <mesh position={[0, 0.7, -0.4]} castShadow>
        <boxGeometry args={[0.9, 0.6, 1.4]} />
        <meshStandardMaterial color="#8b0000" roughness={0.7} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.05, -0.4]} castShadow>
        <coneGeometry args={[0.85, 0.35, 4]} />
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </mesh>
      {/* Main Mast & Sail */}
      <mesh position={[0, 1.8, 0.4]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 2.8, 6]} />
        <meshStandardMaterial color="#3d2817" />
      </mesh>
      <mesh position={[0.45, 1.9, 0.4]} rotation={[0, 0.2, 0]}>
        <planeGeometry args={[1.0, 1.8]} />
        <meshStandardMaterial color="#e5e7eb" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      {/* Bronze Shield array along the gunwale */}
      {[-0.8, -0.2, 0.4, 1.0].map((pz, idx) => (
        <group key={idx}>
          <mesh position={[-0.62, 0.45, pz]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.15, 8]} />
            <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.62, 0.45, pz]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.15, 8]} />
            <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Yuan Mongol Warship / Fleet Transport
 */
const MongolWarJunk: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({
  position,
  rotationY = 0,
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Hull */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.3, 0.65, 3.6]} />
        <meshStandardMaterial color="#2d221a" roughness={0.9} />
      </mesh>
      {/* Heavy fortified bow */}
      <mesh position={[0, 0.4, 2.0]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 0.8]} />
        <meshStandardMaterial color="#1f1813" roughness={0.9} />
      </mesh>
      {/* Tower / Castle deck */}
      <mesh position={[0, 0.85, -0.6]} castShadow>
        <boxGeometry args={[1.1, 0.8, 1.5]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      {/* Mast & Black Mongol Sail */}
      <mesh position={[0, 1.9, 0.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 3.0, 6]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[-0.45, 2.0, 0.5]} rotation={[0, -0.2, 0]}>
        <planeGeometry args={[1.1, 1.9]} />
        <meshStandardMaterial color="#1e293b" side={THREE.DoubleSide} roughness={0.95} />
      </mesh>
    </group>
  );
};

/**
 * Bronze Drum of Dai Viet (Trống đồng Đông Sơn hộ vệ căn cứ)
 */
const BronzeDrum: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Drum base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.5, 16]} />
        <meshStandardMaterial color="#92400e" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Tympanum / Top Sunburst */}
      <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.36, 16]} />
        <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Drum stand / pavilion roof */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <coneGeometry args={[0.7, 0.35, 4]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.7} />
      </mesh>
    </group>
  );
};

/**
 * Military Command Pavilion (Tổng hành dinh / Doanh trại)
 */
const CommandPavilion: React.FC<{
  position: [number, number, number];
  color: string;
  isDaiViet?: boolean;
}> = ({ position, color, isDaiViet = true }) => {
  return (
    <group position={position}>
      {/* Raised stone foundation */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[2.4, 0.3, 2.4]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
      {/* 4 Pillars */}
      {[
        [-0.9, -0.9],
        [0.9, -0.9],
        [-0.9, 0.9],
        [0.9, 0.9],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.85, pz]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 1.2, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
      ))}
      {/* Imperial / Campaign Roof */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[1.7, 0.75, 4]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Roof peak finial */}
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Commander Table / War Map Inside */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {/* Interior warm lamp light */}
      <pointLight position={[0, 1.0, 0]} color={isDaiViet ? '#fbbf24' : '#f87171'} intensity={0.9} distance={3.5} />
    </group>
  );
};

export const BaseCamps3D: React.FC = () => {
  return (
    <group>
      {/* ======================================================== */}
      {/* PHE TRÁI / TÂY: CĂN CỨ THỦY BINH ĐẠI VIỆT                */}
      {/* ======================================================== */}
      <group position={[-12.2, 0, 0]}>
        {/* Doanh trại Tổng hành dinh Đại Việt */}
        <CommandPavilion position={[0, 0.1, 0]} color="#991b1b" isDaiViet />

        {/* Trống đồng hộ vệ phía trước doanh trại */}
        <BronzeDrum position={[1.4, 0, 0.8]} />

        {/* Đại kỳ Sát Thát (Thêu chữ vàng trên nền cờ đỏ) */}
        <UprightBanner
          position={[1.5, 0, -1.2]}
          text="SÁT THÁT"
          subText="TRẦN TRIỀU"
          bannerColor="#991b1b"
          goldTrim
        />
        <UprightBanner
          position={[0, 0, 1.8]}
          text="TIẾT CHẾ"
          subText="ĐẠI VƯƠNG"
          bannerColor="#1e3a8a"
          goldTrim
        />

        {/* Soái thuyền Trần Hưng Đạo neo sát bờ sông */}
        <DaiVietWarJunk position={[1.2, -0.15, -3.2]} rotationY={Math.PI / 4} />
        <DaiVietWarJunk position={[1.0, -0.15, 3.2]} rotationY={-Math.PI / 4} />
      </group>

      {/* ======================================================== */}
      {/* PHE PHẢI / ĐÔNG: CĂN CỨ CHIẾN THUYỀN MÔNG NGUYÊN        */}
      {/* ======================================================== */}
      <group position={[12.2, 0, 0]}>
        {/* Doanh trại dã chiến Nguyên Mông (Yurt / Command Tent) */}
        <CommandPavilion position={[0, 0.1, 0]} color="#1e293b" isDaiViet={false} />

        {/* Cờ hiệu Mông Nguyên (Đại Hãn vương triều) */}
        <UprightBanner
          position={[-1.5, 0, -1.2]}
          text="ĐẠI NGUYÊN"
          subText="VẠN HỘ"
          bannerColor="#0f172a"
          goldTrim
        />
        <UprightBanner
          position={[-1.4, 0, 1.2]}
          text="Ô MÃ NHI"
          subText="PHÀN TIẾP"
          bannerColor="#7f1d1d"
          goldTrim
        />

        {/* Đoàn chiến thuyền giặc Nguyên Mông dàn trận áp sát */}
        <MongolWarJunk position={[-1.2, -0.15, -3.4]} rotationY={-Math.PI / 3} />
        <MongolWarJunk position={[-1.0, -0.15, 3.4]} rotationY={Math.PI / 3} />
      </group>
    </group>
  );
};

