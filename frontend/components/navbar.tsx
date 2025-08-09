"use client"

import { useState, useEffect } from "react";
import { Navbar as HeroUINavbar } from "@heroui/navbar";
import {Button, Image, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@heroui/react";
import NextLink from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!;
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!;

export const Navbar = () => {
  const router = useRouter()

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // On mount, check JWT
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_HOST}:${API_PORT}/jwt-claims`, {
          method: "GET",
          credentials: "include",
        });
        console.log(res)
        if (res.ok) {
          setIsLoggedIn(true);
        }
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  const handleAccountSettings = () => {
    router.push("/account")
  }

  const handleLogout = async () => {
    await fetch(`${API_HOST}:${API_PORT}/logout`, {
      method: "POST",
      credentials: "include",
    });
    location.replace("/")
  };

  return (
    <HeroUINavbar position="sticky" className="px-4">
      <div className="flex items-center justify-between w-full">
        <NextLink href="/" className="flex items-center">
          <Image
            alt="Logo Beach Garden"
            as={NextImage}
            height={36}
            width={36}
            src="/logo.png"
          />
          <p className="font-bold ml-5">Beach Garden SXM</p>
        </NextLink>

        {isLoggedIn && (
          <Dropdown>
            <DropdownTrigger>
              <Button color="primary">Mon compte</Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profil Actions">
              <DropdownItem key="settings" onClick={handleAccountSettings}>
                Paramètres du compte
              </DropdownItem>
              <DropdownItem key="logout" onClick={handleLogout}>
                Déconnexion
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
    </HeroUINavbar>
  );
};
