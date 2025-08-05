"use client"

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  Logo,
} from "@/components/icons";
import {Image} from "@heroui/react";
import NextImage from "next/image";

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
        <p className="font-bold text-inherit ml-5">Beach Garden</p>
      </NextLink>
      <Link
        className={buttonStyles({ variant: "flat", radius: "50", color: "primary" })}
        href="/login"
      >
        Se connecter
      </Link>
    </HeroUINavbar>
  );
};
