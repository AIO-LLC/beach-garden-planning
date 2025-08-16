"use client"

import { LuUser } from "react-icons/lu"
import { IoIosLogOut } from "react-icons/io"
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
import { useRouter } from "next/navigation"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export const Navbar = () => {
  const router = useRouter()

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // On mount, check JWT
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_HOST}:${API_PORT}/jwt-claims`, {
          method: "GET",
          credentials: "include"
        })

        if (res.ok) {
          setIsLoggedIn(true)
        }
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  const handleAccountSettings = () => {
    router.push("/account")
  }

  const handleLogout = async () => {
    await fetch(`${API_HOST}:${API_PORT}/logout`, {
      method: "POST",
      credentials: "include"
    })
    location.replace("/")
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
                <DropdownItem
                  key="settings"
                  onClick={handleAccountSettings}
                  startContent={<LuUser />}
                >
                  Paramètres du compte
                </DropdownItem>
              </DropdownSection>
              <DropdownItem
                key="logout"
                className="text-danger"
                onClick={handleLogout}
                startContent={<IoIosLogOut />}
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
