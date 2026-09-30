import React, { useState } from 'react'
import { Supplier } from '@/core/domain/entities'
import { CreateSupplierDTO } from '@/core/use-cases'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/presentation/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Users, PlusCircle, Phone, Mail, MapPin, AlertCircle } from 'lucide-react'

interface SuppliersViewProps {
  suppliers: Supplier[]
  onCreateSupplier: (dto: CreateSupplierDTO) => Promise<Supplier>
  onRefresh?: () => void
}

export function SuppliersView({ suppliers, onCreateSupplier, onRefresh }: SuppliersViewProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre del proveedor es obligatorio.')
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateSupplier({
        name: name.trim(),
        contact: contact.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      })

      setName('')
      setContact('')
      setPhone('')
      setEmail('')
      setAddress('')
      setOpen(false)
      onRefresh?.()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocurrió un error al registrar el proveedor.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Gestión de Proveedores</h2>
          <p className="text-sm text-slate-500">
            Administración de contactos comerciales para compras y remitos de mercadería.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Registrar Proveedor</DialogTitle>
                <DialogDescription>
                  Ingresa los datos de contacto del distribuidor o fabricante.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-3 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Razón Social / Nombre *</label>
                  <Input
                    placeholder="ej. Distribuidora San Martín"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Persona de Contacto</label>
                  <Input
                    placeholder="ej. Juan Pérez (Vendedor)"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Teléfono</label>
                    <Input
                      placeholder="11-4455-6677"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email</label>
                    <Input
                      type="email"
                      placeholder="ventas@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Dirección</label>
                  <Input
                    placeholder="Av. Corrientes 1234, CABA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Dirección</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No hay proveedores registrados. Haz clic en "+ Nuevo Proveedor" para dar de alta el primero.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((sup) => (
                <TableRow key={sup.id}>
                  <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    {sup.name}
                  </TableCell>
                  <TableCell>{sup.contact ?? '-'}</TableCell>
                  <TableCell>
                    {sup.phone ? (
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {sup.phone}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {sup.email ? (
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {sup.email}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {sup.address ? (
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {sup.address}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
