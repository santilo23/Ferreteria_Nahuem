import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Package, ShoppingCart, Layers, TrendingUp } from 'lucide-react'

export function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'stock' | 'suppliers' | 'reports'>('pos')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg font-bold flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Ferretería Nahuem</h1>
            <p className="text-xs text-slate-500">Control de Stock y Facturación</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button
            variant={activeTab === 'pos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pos')}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Punto de Venta
          </Button>
          <Button
            variant={activeTab === 'stock' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('stock')}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Inventario
          </Button>
          <Button
            variant={activeTab === 'suppliers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('suppliers')}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Proveedores
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('reports')}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Métricas
          </Button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Arquitectura Base Inicializada</h2>
          <p className="text-slate-600 text-sm mb-4">
            Entorno configurado con Vite, React, TypeScript, Tailwind CSS y shadcn/ui.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clean Architecture</span>
              <p className="text-sm font-medium mt-1">/src/core, /src/infrastructure, /src/presentation</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estilos & UI</span>
              <p className="text-sm font-medium mt-1">Tailwind CSS + shadcn/ui</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desktop Shell</span>
              <p className="text-sm font-medium mt-1">Tauri v2 Scaffolding</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
