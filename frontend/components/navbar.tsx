"use client"

import { Navbar as HeroUINavbar } from "@heroui/navbar"
import { Link } from "@heroui/link"
import NextLink from "next/link"
import { button as buttonStyles } from "@heroui/theme"
import { Image } from "@heroui/react"
import NextImage from "next/image"

export const Navbar = () => {
  return (
    <HeroUINavbar position="sticky">
      <NextLink className="flex justify-center items-center" href="/">
        <Image
          alt="Logo Beach Garden"
          as={NextImage}
          height={36}
          src="/logo.png"
          width={36}
        />
        <p className="font-bold text-inherit ml-5">Beach Garden SXM</p>
      </NextLink>
    </HeroUINavbar>
  )
}
