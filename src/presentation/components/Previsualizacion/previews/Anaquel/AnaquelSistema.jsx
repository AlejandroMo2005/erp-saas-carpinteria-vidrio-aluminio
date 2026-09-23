
import { useRef, useMemo } from "react";
import { useFrame }        from "@react-three/fiber";

// three.js: DoubleSide = 2. Valor estable — no cambia entre versiones.
const DoubleSide = 2;

// Inline lerp — evita importar MathUtils de three solo por esta función.
// Equivalente exacto de THREE.MathUtils.lerp(a, b, t).
const lerp = (a, b, t) => a + (b - a) * t;

// ─── Targets de animación ─────────────────────────────────────────────────────
const OFFSET_CORREDIZA = { Cerrada: 0, Entreabierta: 0.36, Abierta: 0.55 };
const ANGULO_ABATIBLE  = {
  Cerrada:      0,
  Entreabierta: Math.PI / 4.2,
  Abierta:      Math.PI / 2.05,
};

const LERP = 0.08;

// ═══════════════════════════════════════════════════════════════════════════
// GEOMETRÍA DE PANEL COMPARTIDA
// ═══════════════════════════════════════════════════════════════════════════

function PanelGeometry({ anchoP, altoP, espesorMarco, colorMarcoHex, opacidadMarco, colorVidrioHex, opacidadVidrio, lManija }) {
  const mMarco = {
    color: colorMarcoHex, roughness: 0.3, metalness: 0.7,
    side: DoubleSide,
    transparent: opacidadMarco < 1, opacity: opacidadMarco,
  };

  return (
    <>
      {/* Marco superior */}
      <mesh position={[0, altoP / 2 - espesorMarco / 2, 0]}>
        <boxGeometry args={[anchoP, espesorMarco, espesorMarco]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      {/* Marco inferior */}
      <mesh position={[0, -altoP / 2 + espesorMarco / 2, 0]}>
        <boxGeometry args={[anchoP, espesorMarco, espesorMarco]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      {/* Marco izquierdo */}
      <mesh position={[-anchoP / 2 + espesorMarco / 2, 0, 0]}>
        <boxGeometry args={[espesorMarco, altoP, espesorMarco]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>
      {/* Marco derecho */}
      <mesh position={[anchoP / 2 - espesorMarco / 2, 0, 0]}>
        <boxGeometry args={[espesorMarco, altoP, espesorMarco]} />
        <meshStandardMaterial {...mMarco} />
      </mesh>

      {/* Vidrio */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[anchoP - espesorMarco * 2, altoP - espesorMarco * 2, 0.007]} />
        <meshPhysicalMaterial
          color={colorVidrioHex}
          transparent opacity={opacidadVidrio}
          roughness={0.04} metalness={0}
          transmission={0.92} thickness={0.25}
          side={DoubleSide}
        />
      </mesh>

      {/* Manija */}
      <mesh position={[lManija, 0, espesorMarco + 0.005]}>
        <boxGeometry args={[0.022, 0.16, 0.032]} />
        <meshStandardMaterial color="#aaa" roughness={0.2} metalness={0.9} />
      </mesh>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL CORREDIZO
// ═══════════════════════════════════════════════════════════════════════════

function PanelCorredizo({
  xBase, anchoP, altoP, zRiel, sentido,
  estadoPuerta, colorMarcoHex, opacidadMarco, colorVidrioHex, opacidadVidrio,
}) {
  const ref      = useRef();
  const curX     = useRef(xBase);
  const espesorM = 0.028;
  const lManija  = sentido * (anchoP / 2 - espesorM - 0.05);

  useFrame((state) => {
    if (!ref.current) return;
    const despl  = (OFFSET_CORREDIZA[estadoPuerta] ?? 0) * anchoP;
    const target = xBase + sentido * despl;
    const diff   = Math.abs(curX.current - target);
    if (diff > 0.001) {
      curX.current = lerp(curX.current, target, LERP);
      ref.current.position.x = curX.current;
      state.invalidate();
    }
  });

  return (
    <group ref={ref} position={[xBase, 0, zRiel]}>
      <PanelGeometry
        anchoP={anchoP} altoP={altoP} espesorMarco={espesorM}
        colorMarcoHex={colorMarcoHex} opacidadMarco={opacidadMarco}
        colorVidrioHex={colorVidrioHex} opacidadVidrio={opacidadVidrio}
        lManija={lManija}
      />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL ABATIBLE
// ═══════════════════════════════════════════════════════════════════════════

function PanelAbatible({
  xBisagra, anchoP, altoP, zFrontal, lado,
  estadoPuerta, colorMarcoHex, opacidadMarco, colorVidrioHex, opacidadVidrio,
}) {
  const rotRef   = useRef();
  const curAngle = useRef(0);
  const espesorM = 0.028;

  const signoX   = lado === "izq" ? 1 : -1;
  const offsetX  = signoX * anchoP / 2;
  const signoRot = lado === "izq" ? -1 : 1;

  useFrame((state) => {
    if (!rotRef.current) return;
    const target = signoRot * (ANGULO_ABATIBLE[estadoPuerta] ?? 0);
    const diff   = Math.abs(curAngle.current - target);
    if (diff > 0.0005) {
      curAngle.current = lerp(curAngle.current, target, LERP);
      rotRef.current.rotation.y = curAngle.current;
      state.invalidate();
    }
  });

  const lManija = -signoX * (anchoP / 2 - espesorM - 0.05);

  return (
    <group position={[xBisagra, 0, zFrontal]}>
      <group ref={rotRef}>
        <group position={[offsetX, 0, 0]}>
          <PanelGeometry
            anchoP={anchoP} altoP={altoP} espesorMarco={espesorM}
            colorMarcoHex={colorMarcoHex} opacidadMarco={opacidadMarco}
            colorVidrioHex={colorVidrioHex} opacidadVidrio={opacidadVidrio}
            lManija={lManija}
          />
          {[-altoP / 3, 0, altoP / 3].map((y, i) => (
            <mesh key={i} position={[-offsetX + signoX * 0.01, y, 0.01]}>
              <cylinderGeometry args={[0.01, 0.01, 0.038, 8]} />
              <meshStandardMaterial color="#bbb" roughness={0.2} metalness={0.9} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function AnaquelSistema({
  ancho, alto, profundidad, tipoPuerta, estadoPuerta,
  colorVidrioHex, opacidadVidrio, colorMarcoHex, opacidadMarco,
}) {
  const anchoS = Math.max(0.1, ancho);
  const altoS  = Math.max(0.1, alto);
  const profS  = Math.max(0.05, profundidad);

  const mitad   = anchoS / 2;
  const espesor = 0.007;

  const zRielDelantero = profS / 2 + espesor / 2 + 0.006;
  const zRielTrasero   = profS / 2 + espesor / 2 + 0.022;

  const propsComunes = useMemo(() => ({
    altoP: altoS, colorMarcoHex, opacidadMarco, colorVidrioHex, opacidadVidrio,
  }), [altoS, colorMarcoHex, opacidadMarco, colorVidrioHex, opacidadVidrio]);

  if (tipoPuerta === "Sin puerta") return null;

  if (tipoPuerta === "Corrediza") {
    return (
      <group>
        <PanelCorredizo
          key={`cl-${anchoS}`}
          xBase={-mitad / 2}
          anchoP={mitad}
          zRiel={zRielDelantero}
          sentido={1}
          estadoPuerta={estadoPuerta}
          {...propsComunes}
        />
        <PanelCorredizo
          key={`cr-${anchoS}`}
          xBase={mitad / 2}
          anchoP={mitad}
          zRiel={zRielTrasero}
          sentido={1}
          estadoPuerta={estadoPuerta}
          {...propsComunes}
        />
      </group>
    );
  }

  if (tipoPuerta === "Abatible") {
    const zFrontal = profS / 2 + espesor / 2 + 0.003;
    return (
      <group>
        <PanelAbatible
          key={`al-${anchoS}`}
          xBisagra={-anchoS / 2}
          anchoP={mitad}
          zFrontal={zFrontal}
          lado="izq"
          estadoPuerta={estadoPuerta}
          {...propsComunes}
        />
        <PanelAbatible
          key={`ar-${anchoS}`}
          xBisagra={anchoS / 2}
          anchoP={mitad}
          zFrontal={zFrontal}
          lado="der"
          estadoPuerta={estadoPuerta}
          {...propsComunes}
        />
      </group>
    );
  }

  return null;
}