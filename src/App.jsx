import { useState, useEffect, lazy, Suspense, useTransition } from 'react'
// src/App.jsx — Sprint 16
// Sprint 17 DT-IA    — Ruta /visualizador-ia agregada como ruta independiente
// Sprint 17 DT-REF-UI — Referencias IA integrada como módulo del dashboard...
//                       Acceso: ADMIN + VENDEDOR. CLIENTE no ve la tarjeta ni la vista...

import './presentation/styles/dashboard-cards.css'
import { Ruler, Calendar, FileText, Package, Receipt, BarChart2 as BarChart, Images } from 'lucide-react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AccessibilityProvider } from './presentation/context/AccessibilityContext'
import { AuthProvider } from './presentation/context/AuthContext'
import { useAuth } from './presentation/context/useAuth'
import RoleGuard from './presentation/components/Auth/RoleGuard'
import ErrorBoundary from './presentation/components/common/ErrorBoundary'

import Navbar from './presentation/components/Layout/Navbar'
import Login  from './presentation/components/Auth/Login'

const cargarLazy = (importador) =>
  lazy(() =>
    importador().catch((error) => {
      throw error
    })
  )

const Perfil             = cargarLazy(() => import('./presentation/components/Perfil/Perfil'))
const Register           = cargarLazy(() => import('./presentation/components/Auth/Register'))
const ForgotPassword     = cargarLazy(() => import('./presentation/components/Auth/ForgotPassword'))
const ResetPassword      = cargarLazy(() => import('./presentation/components/Auth/ResetPassword'))
const AccessibilityPanel = cargarLazy(() =>
  import('./presentation/components/common/AccessibilityPanel').then(
    (m) => ({ default: m.AccessibilityPanel })
  )
)
const Previsualizacion = cargarLazy(() => import('./presentation/components/Previsualizacion'))
const Proformas        = cargarLazy(() => import('./presentation/components/Proformas'))
const Pedidos          = cargarLazy(() => import('./presentation/components/Pedidos'))
const Materiales       = cargarLazy(() => import('./presentation/components/Materiales'))
const DashboardVentas  = cargarLazy(() => import('./presentation/components/Dashboard'))
const Facturacion      = cargarLazy(() => import('./presentation/components/Facturacion/Facturacion'))

// Sprint 17 DT-IA — sin Three.js ni R3F
const VisualizadorIA = cargarLazy(() => import('./presentation/components/VisualizadorIA/VisualizadorIA'))

// Sprint 17 DT-REF-UI — lazy: solo carga cuando ADMIN o VENDEDOR abre el módulo
const ReferenciasIA = cargarLazy(() => import('./presentation/components/VisualizadorIA/Referencias/Referencias'))

const LoadingFallback = () => (
  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh', width:'100%' }}>
    <div style={{
      width: '2.5rem', height: '2.5rem',
      border: '3px solid rgba(0,0,0,0.1)',
      borderTopColor: 'var(--primary-color)',
      borderRadius: '50%',
      animation: 'shell-spin 0.8s linear infinite',
    }} />
  </div>
)

const AccesoDenegado = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem', color:'var(--text-secondary)' }}>
    <span style={{ fontSize:'3rem' }}>🔒</span>
    <h2 style={{ margin:0 }}>Acceso restringido</h2>
    <p style={{ margin:0 }}>No tienes permisos para ver esta sección.</p>
  </div>
)

function Dashboard() {
  const { user, logout, isAdmin, isVendedor } = useAuth()
  const navigate = useNavigate()

  const esAdmin    = isAdmin
  const esVendedor = isVendedor
  const esCliente  = !isAdmin && !isVendedor

  const [view, setView]                               = useState('dashboard')
  const [reloadPedidosTrigger, setReloadPedidosTrigger] = useState(0)
  const [perfilAbierto, setPerfilAbierto]             = useState(false)
  const [isPending, startTransition]                  = useTransition()
  const [panelReady, setPanelReady]                   = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setPanelReady(true), 3000)
    return () => clearTimeout(id)
  }, [])

  const agendarPedido = () => {
    setReloadPedidosTrigger((prev) => prev + 1)
    startTransition(() => setView('pedidos'))
  }

  const VISTAS_PERMITIDAS = {
    CLIENTE:  ['dashboard', 'previsualizacion', 'proformas', 'pedidos'],
    VENDEDOR: ['dashboard', 'previsualizacion', 'proformas', 'pedidos', 'materiales', 'facturacion', 'referencias-ia'],
    ADMIN:    ['dashboard', 'previsualizacion', 'proformas', 'pedidos', 'materiales', 'facturacion', 'dashboard-ventas', 'proveedores', 'referencias-ia'],
  }

  const navegarA = (vista) => {
    // Sprint 17 DT-IA — navega a ruta real independiente
    if (vista === 'visualizador-ia') {
      void navigate('/visualizador-ia')
      return
    }
    const rol        = user?.rol || 'CLIENTE'
    const permitidas = VISTAS_PERMITIDAS[rol] || []
    if (!permitidas.includes(vista)) {
      console.warn(`[RoleGuard] Navegación bloqueada: ${rol} → ${vista}`)
      return
    }
    startTransition(() => setView(vista))
  }

  return (
    <div className="app-container">
      <Navbar
        usuario={user}
        currentView={view}
        onNavigate={navegarA}
        onAbrirPerfil={() => setPerfilAbierto(true)}
        onCerrarSesion={logout}
        isNavigating={isPending}
      />

      {perfilAbierto && (
        <Suspense fallback={null}>
          <Perfil
            usuario={user}
            onCerrar={() => setPerfilAbierto(false)}
            onGuardado={() => setPerfilAbierto(false)}
          />
        </Suspense>
      )}

      <main
        className={`content-area${isPending ? ' content-area--navigating' : ''}`}
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        {view === 'dashboard' && (
          <div className="dashboard">
            <h1 className="dashboard-title">
              Vidrios y Aluminios{' '}
              <span className="title-highlight">"Alejandro"</span>
            </h1>

            {esCliente && (
              <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem', textAlign:'center' }}>
                Bienvenido, {user?.nombre}. Aquí puedes ver tus pedidos y crear proformas.
              </p>
            )}

            <div className="dashboard-grid">
              <button className="card" onClick={() => navegarA('previsualizacion')}>
                <span className="card-icon"><Ruler size={40} strokeWidth={1.5} /></span>
                <div className="card-content">
                  <h2>Previsualización</h2>
                  <p>Simulador a escala en 3D e IA de tus trabajos.</p>
                </div>
              </button>

              <button className="card" onClick={() => navegarA('pedidos')}>
                <span className="card-icon"><Calendar size={40} strokeWidth={1.5} /></span>
                <div className="card-content">
                  <h2>{esCliente ? 'Mis Pedidos' : 'Pedidos'}</h2>
                  <p>{esCliente ? 'Seguimiento de tus pedidos y entregas.' : 'Calendario de entregas y seguimiento de proformas.'}</p>
                </div>
              </button>

              <button className="card" onClick={() => navegarA('proformas')}>
                <span className="card-icon"><FileText size={40} strokeWidth={1.5} /></span>
                <div className="card-content">
                  <h2>{esCliente ? 'Mis Proformas' : 'Proformas'}</h2>
                  <p>{esCliente ? 'Solicita un presupuesto para tu trabajo.' : 'Genera presupuestos detallados y agendalos.'}</p>
                </div>
              </button>

              {(esAdmin || esVendedor) && (
                <button className="card" onClick={() => navegarA('materiales')}>
                  <span className="card-icon"><Package size={40} strokeWidth={1.5} /></span>
                  <div className="card-content">
                    <h2>{esAdmin ? 'Inventario' : 'Consultar Stock'}</h2>
                    <p>{esAdmin ? 'Control de stock y precios al instante.' : 'Consulta disponibilidad de materiales.'}</p>
                  </div>
                </button>
              )}

              {(esAdmin || esVendedor) && (
                <button className="card" onClick={() => navegarA('facturacion')}>
                  <span className="card-icon"><Receipt size={40} strokeWidth={1.5} /></span>
                  <div className="card-content">
                    <h2>Facturación</h2>
                    <p>Gestión de facturas electrónicas y pedidos a proveedores.</p>
                  </div>
                </button>
              )}

              {esAdmin && (
                <button className="card" onClick={() => navegarA('dashboard-ventas')}>
                  <span className="card-icon"><BarChart size={40} strokeWidth={1.5} /></span>
                  <div className="card-content">
                    <h2>Dashboard</h2>
                    <p>Métricas de ventas y actividades históricas.</p>
                  </div>
                </button>
              )}

              {/* Sprint 17 DT-REF-UI — ADMIN y VENDEDOR ven la tarjeta. CLIENTE no. */}
              {(esAdmin || esVendedor) && (
                <button className="card" onClick={() => navegarA('referencias-ia')}>
                  <span className="card-icon"><Images size={40} strokeWidth={1.5} /></span>
                  <div className="card-content">
                    <h2>Referencias IA</h2>
                    <p>{esAdmin ? 'Gestiona las fotos que guían el estilo de las generaciones IA.' : 'Galería de referencias visuales por tipo de trabajo.'}</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        <Suspense fallback={<div style={{ minHeight:'60vh' }}><LoadingFallback /></div>}>
          {view === 'previsualizacion' && (
            <ErrorBoundary modulo="Previsualización">
              {/* Sprint 17 DT-IA — pasa callback para abrir el visualizador IA */}
              <Previsualizacion onAbrirIA={() => navegarA('visualizador-ia')} />
            </ErrorBoundary>
          )}
          {view === 'proformas' && (
            <ErrorBoundary modulo="Proformas">
              <Proformas onAgendar={agendarPedido} />
            </ErrorBoundary>
          )}
          {view === 'pedidos' && (
            <ErrorBoundary modulo="Pedidos">
              <Pedidos key={reloadPedidosTrigger} />
            </ErrorBoundary>
          )}
          {view === 'materiales' && (
            <ErrorBoundary modulo="Inventario">
              <RoleGuard roles={['ADMIN', 'VENDEDOR']} fallback={<AccesoDenegado />}>
                <Materiales />
              </RoleGuard>
            </ErrorBoundary>
          )}
          {view === 'facturacion' && (
            <ErrorBoundary modulo="Facturación">
              <RoleGuard roles={['ADMIN', 'VENDEDOR']} fallback={<AccesoDenegado />}>
                <Facturacion />
              </RoleGuard>
            </ErrorBoundary>
          )}
          {view === 'dashboard-ventas' && (
            <ErrorBoundary modulo="Dashboard de ventas">
              <RoleGuard roles={['ADMIN']} fallback={<AccesoDenegado />}>
                <DashboardVentas />
              </RoleGuard>
            </ErrorBoundary>
          )}

          {/* Sprint 17 DT-REF-UI — módulo de referencias IA */}
          {view === 'referencias-ia' && (
            <ErrorBoundary modulo="Referencias IA">
              <RoleGuard roles={['ADMIN', 'VENDEDOR']} fallback={<AccesoDenegado />}>
                <ReferenciasIA />
              </RoleGuard>
            </ErrorBoundary>
          )}
        </Suspense>
      </main>

      {panelReady && (
        <Suspense fallback={null}>
          <AccessibilityPanel />
        </Suspense>
      )}
    </div>
  )
}

function AppContent() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/" element={<Login />} />
          <Route path="/register"
            element={<Suspense fallback={<LoadingFallback />}><Register /></Suspense>}
          />
          <Route path="/forgot-password"
            element={<Suspense fallback={<LoadingFallback />}><ForgotPassword /></Suspense>}
          />
          <Route path="/reset-password/:token"
            element={<Suspense fallback={<LoadingFallback />}><ResetPassword /></Suspense>}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      ) : (
        <>
          {/*
            Sprint 17 DT-IA — debe ir ANTES de "/*" para que React Router
            lo resuelva primero. Página limpia sin Navbar ni Three.js.
          */}
          <Route
            path="/visualizador-ia"
            element={
              <ErrorBoundary modulo="Visualizador IA">
                <Suspense fallback={<LoadingFallback />}>
                  <VisualizadorIA />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<Dashboard />} />
        </>
      )}
    </Routes>
  )
}

function App() {
  useEffect(() => {
    const shell      = document.getElementById('app-shell')
    const shellLogin = document.getElementById('app-shell-login')
    if (shell)      shell.classList.add('app-shell--hidden')
    if (shellLogin) shellLogin.classList.add('app-shell--hidden')
  }, [])

  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  )
}

export default App
