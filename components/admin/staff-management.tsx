"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus, Mail, Shield, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type StaffMember = {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

type Props = {
  staffMembers: StaffMember[]
}

export default function StaffManagement({ staffMembers }: Props) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("sekreter")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit staff state
  const [editOpen, setEditOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [editFullName, setEditFullName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Reset password state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Personel eklenirken hata oluştu")
      }

      // Reset form
      setFullName("")
      setEmail("")
      setPassword("")
      setRole("sekreter")
      setIsOpen(false)

      toast({
        title: "Başarılı",
        description: `Personel başarıyla eklendi. E-posta: ${email}`,
      })

      // Refresh page
      setTimeout(() => window.location.reload(), 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setEditFullName(staff.full_name)
    setEditEmail(staff.email)
    setEditRole(staff.role)
    setEditPassword("")
    setEditOpen(true)
  }

  const handleUpdateStaff = async () => {
    if (!selectedStaff || !editFullName || !editEmail || !editRole) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurunuz",
        variant: "destructive",
      })
      return
    }

    if (editPassword && editPassword.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalı",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch("/api/admin/staff/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStaff.id,
          full_name: editFullName,
          email: editEmail,
          role: editRole,
          password: editPassword || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Personel güncellenirken hata oluştu")
      }

      toast({
        title: "Başarılı",
        description: "Personel bilgileri başarıyla güncellendi",
      })

      setEditOpen(false)
      setSelectedStaff(null)
      setEditFullName("")
      setEditEmail("")
      setEditRole("")
      setEditPassword("")

      setTimeout(() => window.location.reload(), 1000)
    } catch (err: unknown) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword || newPassword.length < 6) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurunuz ve şifre en az 6 karakter olmalı",
        variant: "destructive",
      })
      return
    }

    setIsResetting(true)

    try {
      const response = await fetch("/api/admin/staff/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Şifre sıfırlanırken hata oluştu")
      }

      toast({
        title: "Başarılı",
        description: "Şifre başarıyla sıfırlandı",
      })

      setResetPasswordOpen(false)
      setSelectedUserId(null)
      setNewPassword("")
    } catch (err: unknown) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">Toplam {staffMembers.length} personel kaydı</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Yeni Personel Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Personel Ekle</DialogTitle>
              <DialogDescription>
                Sisteme yeni kullanıcı ekleyin. Oluşturulan kullanıcı giriş bilgileri ile sisteme erişebilecek.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Ad Soyad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    E-posta <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      placeholder="ahmet@klinik.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Şifre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Rol <span className="text-destructive">*</span>
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doktor">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Doktor (Tam Yetki)
                        </div>
                      </SelectItem>
                      <SelectItem value="sekreter">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Sekreter (Kısıtlı Yetki)
                        </div>
                      </SelectItem>
                      <SelectItem value="hemsire">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Hemşire (Kısıtlı Yetki)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Ekleniyor..." : "Personel Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Henüz personel kaydı yok
                </TableCell>
              </TableRow>
            ) : (
              staffMembers.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.full_name}</TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        staff.role === "doktor"
                          ? "bg-blue-100 text-blue-700"
                          : staff.role === "hemsire"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {staff.role === "doktor" ? "Doktor" : staff.role === "hemsire" ? "Hemşire" : "Sekreter"}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(staff.created_at).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(staff)}>
                      <Key className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Personel Düzenle</DialogTitle>
            <DialogDescription>Personel bilgilerini güncelleyin. Şifre alanını boş bırakırsanız değişmez.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">
                Ad Soyad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit_full_name"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Personel adı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">
                E-posta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit_email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="ornek@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_role">
                Rol <span className="text-destructive">*</span>
              </Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger id="edit_role">
                  <SelectValue placeholder="Rol seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doktor">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Doktor (Tam Yetki)
                    </div>
                  </SelectItem>
                  <SelectItem value="sekreter">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Sekreter (Kısıtlı Yetki)
                    </div>
                  </SelectItem>
                  <SelectItem value="hemsire">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Hemşire (Kısıtlı Yetki)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_password">Yeni Şifre (isteğe bağlı)</Label>
              <Input
                id="edit_password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Değiştirmek için yeni şifre girin"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Boş bırakırsanız şifre değişmez</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditOpen(false)
                setSelectedStaff(null)
                setEditFullName("")
                setEditEmail("")
                setEditRole("")
                setEditPassword("")
              }}
            >
              İptal
            </Button>
            <Button type="button" onClick={handleUpdateStaff} disabled={isUpdating}>
              {isUpdating ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
