"use client"

import {
  FilePlusIcon,
  FilesIcon,
  InfoIcon,
  SealCheckIcon,
  SignOutIcon,
} from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { APP_NAME, ROUTES } from "@/constants/app"
import { useAuthStore } from "@/stores/auth.store"

const NAV_ITEMS = [
  {
    label: "Documents",
    href: ROUTES.documents,
    icon: FilesIcon,
    isActive: (path: string) =>
      path === ROUTES.documents ||
      (path.startsWith(`${ROUTES.documents}/`) && path !== ROUTES.createDocument),
  },
  {
    label: "Create Document",
    href: ROUTES.createDocument,
    icon: FilePlusIcon,
    isActive: (path: string) => path === ROUTES.createDocument,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut)
  const logout = useAuthStore((state) => state.logout)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={ROUTES.documents}>
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <SealCheckIcon className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{APP_NAME}</span>
                  <span className="text-muted-foreground truncate text-xs">Integrasi TTE</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive(pathname)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <div className="bg-sidebar-accent/60 text-muted-foreground flex gap-2 rounded-lg p-3 text-xs">
            <InfoIcon className="text-primary mt-0.5 size-4 shrink-0" />
            <p>Demo Mode: dokumen dan template disimpan lokal di browser.</p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              disabled={isLoggingOut}
              onClick={() => void logout()}
            >
              {isLoggingOut ? <Spinner /> : <SignOutIcon />}
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
