import { Database, CircleCheck } from 'lucide-react'

export type TabType = 'dashboard' | 'pos' | 'entries' | 'stock' | 'sales' | 'suppliers'

interface ShortcutBarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onOpenBackup?: () => void
}

interface ShortcutItem {
  key: string
  label: string
  tab: TabType
}

const shortcuts: ShortcutItem[] = [
  { key: 'F1', label: 'Inicio', tab: 'dashboard' },
  { key: 'F2', label: 'Venta', tab: 'pos' },
  { key: 'F3', label: 'Ingresos', tab: 'entries' },
  { key: 'F4', label: 'Inventario', tab: 'stock' },
  { key: 'F5', label: 'Ventas', tab: 'sales' },
  { key: 'F6', label: 'Proveedores', tab: 'suppliers' },
]

export function ShortcutBar({ activeTab, onTabChange, onOpenBackup }: ShortcutBarProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 px-6 py-2 flex flex-col sm:flex-row items-center justify-between text-xs gap-3 print:hidden sticky bottom-0 z-30 select-none shadow-md">
      {/* System Status Indicators */}
      <div className="flex items-center gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300">SQLite Local Activo</span>
        </div>
        <span className="text-slate-600 hidden md:inline">|</span>
        <div className="hidden md:flex items-center gap-1.5 text-slate-400">
          <Database className="h-3 w-3 text-blue-400" />
          <span>Ferretería Nahuem v1.0</span>
        </div>
        <span className="text-slate-600 hidden lg:inline">|</span>
        <div className="hidden lg:flex items-center gap-1 text-slate-400">
          <CircleCheck className="h-3 w-3 text-emerald-400" />
          <span>Modo Offline Mostrador</span>
        </div>
      </div>

      {/* Global Shortcut Quick Keys */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          Atajos:
        </span>
        {shortcuts.map(({ key, label, tab }) => {
          const isActive = activeTab === tab
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <kbd className="px-1 py-0.2 bg-slate-950 text-slate-200 border border-slate-700 rounded text-[10px] font-mono font-semibold">
                {key}
              </kbd>
              <span>{label}</span>
            </button>
          )
        })}
        <div className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 ml-1">
          <kbd className="px-1 py-0.2 bg-slate-950 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
            ESC
          </kbd>
          <span>Cerrar</span>
        </div>

        {onOpenBackup && (
          <button
            type="button"
            onClick={onOpenBackup}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 transition-colors ml-1.5 cursor-pointer"
          >
            <Database className="h-3 w-3 text-emerald-400" />
            <span>Respaldos</span>
          </button>
        )}
      </div>
    </footer>
  )
}
