"use client"

import { LuUser, LuShield, LuLogOut } from "react-icons/lu"
import { useState, useEffect } from "react"
import { Navbar as HeroUINavbar } from "@heroui/navbar"
import {
  Button,
  Image,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection
} from "@heroui/react"
import NextLink from "next/link"
import NextImage from "next/image"
import { getAuthToken, logout } from "@/hooks/useAuth"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT
const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

export const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = getAuthToken()

        if (!token) {
          setIsLoggedIn(false)
          return
        }

        const response = await fetch(`${API_URL}/verify-token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          const claims = await response.json()
          setIsAdmin(claims.is_admin)
          setIsLoggedIn(true)
        } else {
          setIsLoggedIn(false)
        }
      } catch (err) {
        console.error(err)
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  const handleAdminPanel = () => {
    location.replace("/admin-panel")
  }

  const handleAccountSettings = () => {
    location.replace("/account")
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <HeroUINavbar className="px-4" position="sticky">
      <div className="flex items-center justify-between w-full">
        <NextLink className="flex items-center" href="/">
          <Image
            alt="Logo Beach Garden"
            as={NextImage}
            height={36}
            src="/logo.png"
            width={36}
          />
          <p className="font-bold ml-5">Beach Garden SXM</p>
        </NextLink>

        {isLoggedIn && (
          <Dropdown>
            <DropdownTrigger>
              <Button color="primary">Mon compte</Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profil Actions">
              <DropdownSection showDivider>
                <>
                  {isAdmin && (
                    <DropdownItem
                      key="admin-panel"
                      onClick={handleAdminPanel}
                      startContent={<LuShield />}
                    >
                      Administration
                    </DropdownItem>
                  )}
                  <DropdownItem
                    key="settings"
                    onClick={handleAccountSettings}
                    startContent={<LuUser />}
                  >
                    Paramètres du compte
                  </DropdownItem>
                </>
              </DropdownSection>
              <DropdownItem
                key="logout"
                className="text-danger"
                onClick={handleLogout}
                startContent={<LuLogOut />}
              >
                Déconnexion
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
    </HeroUINavbar>
  )
}
