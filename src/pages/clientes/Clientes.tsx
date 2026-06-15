import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, Phone, Mail, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useClientesList, useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/hooks/useClientes'
import type { Cliente, ClienteFormData } from '@/hooks/useClientes'

const empty: ClienteFormData = { nome: '', telefone: '', email: '', observacao: '' }

export default function Clientes() {
  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCliente, setEditCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState<ClienteFormData>(empty)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: clientes = [], isLoading } = useClientesList()
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const deleteCliente = useDeleteCliente()

  const filtrados = clientes.filter(c =>
    busca === '' ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? '').includes(busca) ||
    (c.email ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  function openNew() {
    setEditCliente(null)
    setForm(empty)
    setDialogOpen(true)
  }

  function openEdit(c: Cliente) {
    setEditCliente(c)
    setForm({ nome: c.nome, telefone: c.telefone ?? '', email: c.email ?? '', observacao: c.observacao ?? '' })
    setDialogOpen(true)
  }

  function handleSubmit() {
    if (!form.nome.trim()) return
    if (editCliente) {
      updateCliente.mutate({ id: editCliente.id, form }, { onSuccess: () => setDialogOpen(false) })
    } else {
      createCliente.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function handleDelete() {
    if (!deleteId) return
    deleteCliente.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
  }

  return (
    <div className="p-6 space-y-6 bg-ilunna-cream min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ilunna-dark">Clientes</h1>
          <p className="text-ilunna-muted text-sm mt-0.5">Cadastro de clientes</p>
        </div>
        <Button className="bg-ilunna-terracotta hover:bg-ilunna-brown text-white gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Card className="bg-white border-ilunna-light">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ilunna-light flex items-center justify-center">
              <Users className="w-5 h-5 text-ilunna-terracotta" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ilunna-dark">{clientes.length}</p>
              <p className="text-xs text-ilunna-muted">Total de clientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ilunna-muted" />
        <Input
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-9 border-ilunna-light"
        />
      </div>

      {/* Table */}
      <Card className="border-ilunna-light shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-ilunna-light hover:bg-transparent">
              <TableHead className="text-ilunna-muted font-medium">Nome</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Telefone</TableHead>
              <TableHead className="text-ilunna-muted font-medium">E-mail</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Observacao</TableHead>
              <TableHead className="text-right text-ilunna-muted font-medium">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-ilunna-muted">
                    <Users className="w-10 h-10 opacity-30" />
                    <p className="font-medium">{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtrados.map(c => (
              <TableRow key={c.id} className="border-ilunna-light hover:bg-ilunna-light/30">
                <TableCell className="font-medium text-ilunna-dark">{c.nome}</TableCell>
                <TableCell>
                  {c.telefone ? (
                    <span className="flex items-center gap-1 text-sm text-ilunna-muted">
                      <Phone className="w-3 h-3" />{c.telefone}
                    </span>
                  ) : <span className="text-ilunna-muted/50 text-sm">-</span>}
                </TableCell>
                <TableCell>
                  {c.email ? (
                    <span className="flex items-center gap-1 text-sm text-ilunna-muted">
                      <Mail className="w-3 h-3" />{c.email}
                    </span>
                  ) : <span className="text-ilunna-muted/50 text-sm">-</span>}
                </TableCell>
                <TableCell className="text-sm text-ilunna-muted max-w-[200px] truncate">
                  {c.observacao || <span className="opacity-40">-</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-ilunna-terracotta" onClick={() => openEdit(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-red-500" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-ilunna-dark">
              {editCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome <span className="text-red-500">*</span></Label>
              <Input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome completo"
                className="border-ilunna-light"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone / WhatsApp</Label>
              <Input
                value={form.telefone}
                onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="border-ilunna-light"
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                type="email"
                className="border-ilunna-light"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Observacao</Label>
              <Input
                value={form.observacao}
                onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                placeholder="Notas sobre o cliente"
                className="border-ilunna-light"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-ilunna-light">
              Cancelar
            </Button>
            <Button
              className="bg-ilunna-terracotta hover:bg-ilunna-brown text-white"
              onClick={handleSubmit}
              disabled={!form.nome.trim() || createCliente.isPending || updateCliente.isPending}
            >
              {editCliente ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open: boolean) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-ilunna-dark">Remover cliente?</DialogTitle>
            <DialogDescription className="text-ilunna-muted">
              Esta acao nao pode ser desfeita. O cliente sera removido do cadastro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="border-ilunna-light">
              Cancelar
            </Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white" disabled={deleteCliente.isPending}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
