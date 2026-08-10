"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, UserCog, LayoutDashboard, Menu, MessageSquare, Pill, BellRing, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Randevular", href: "/admin", icon: LayoutDashboard, roles: ["doktor", "sekreter", "hemsire"] },
  { name: "Hastalar", href: "/admin/patients", icon: Users, roles: ["doktor", "sekreter", "hemsire"] },
  { name: "Randevu Programı", href: "/admin/schedules", icon: Calendar, roles: ["doktor", "sekreter", "hemsire"] },
  {
    name: "SMS Şablonları",
    href: "/admin/sms-templates",
    icon: MessageSquare,
    roles: ["doktor", "sekreter", "hemsire"],
  },
  {
    name: "İlaç/Vitamin Listeleri",
    href: "/admin/predefined-lists",
    icon: Pill,
    roles: ["doktor", "sekreter", "hemsire"],
  },
  {
    name: "Hatırlatmalar",
    href: "/admin/reminders",
    icon: BellRing,
    roles: ["doktor", "sekreter"],
  },
  { name: "Personel", href: "/admin/staff", icon: UserCog, roles: ["doktor"] }, // Only doctors
]

export function AdminSidebar({ userRole }: { userRole: string | null }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => !userRole || item.roles.includes(userRole))

  return (
    <>
      {/* Mobile Menu Toggle Button - Always on top */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-[60] lg:hidden bg-white shadow-md border border-gray-200 hover:bg-gray-50"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Menüyü Aç"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay - Click to close (mobile) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[50] bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Desktop: narrow icon rail placeholder that reserves layout space (kept out of flow, so expansion overlays) */}
      <div className="hidden lg:block w-16 flex-shrink-0" aria-hidden="true" />

      {/* Sidebar — desktop: fixed icon rail (w-16) that expands to w-64 on hover; mobile: slide-in drawer */}
      <aside
        className={cn(
          "group z-[55] h-screen border-r border-gray-200 bg-white overflow-hidden",

          // Desktop: fixed narrow rail, expands on hover
          "lg:fixed lg:left-0 lg:top-0 lg:w-16 lg:hover:w-64 lg:shadow-none lg:hover:shadow-xl lg:transition-[width] lg:duration-200",

          // Mobile: fixed slide-in drawer at full width
          "fixed left-0 top-0 w-64 transition-transform duration-300 lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-3 lg:px-[18px]">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="whitespace-nowrap opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100">
              <h1 className="text-base font-semibold text-gray-900">SağlıkSistemi</h1>
              <p className="text-xs text-gray-600">Yönetim Paneli</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={item.name}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-500")} />
                  <span className="whitespace-nowrap opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="rounded-lg bg-blue-50 p-3 whitespace-nowrap opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100">
              <p className="text-xs font-medium text-blue-900">Sistem v1.0</p>
              <p className="text-xs text-blue-700">Tüm hakları saklıdır</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
