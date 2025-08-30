"use client"

import { useState, useEffect } from "react"
import { Link } from "@heroui/link"
import { button as buttonStyles } from "@heroui/theme"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT
const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/jwt-claims`, {
          method: "GET",
          credentials: "include"
        })

        setIsLoggedIn(res.ok)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  return (
    <>
      {!isLoggedIn && (
        <Link
          className={buttonStyles({ color: "primary" }) + " mt-8"}
          href="/login"
        >
          Se connecter
        </Link>
      )}
      {isLoggedIn && (
        <Link
          className={buttonStyles({ color: "primary" }) + " mt-8"}
          href="/planning"
        >
          Réserver un terrain
        </Link>
      )}
    </>
  )
}
