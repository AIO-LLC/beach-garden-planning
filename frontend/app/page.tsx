"use client"

import { useState, useEffect } from "react"
import { Link } from "@heroui/link"
import { button as buttonStyles } from "@heroui/theme"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_HOST}:${API_PORT}/jwt-claims`, {
          method: "GET",
          credentials: "include",
        })
        setIsLoggedIn(res.ok)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  return (
    <ul>
      {!isLoggedIn && (
        <li>
          <Link
            className={buttonStyles({ color: "primary" })}
            href="/login"
          >
            Se connecter
          </Link>
        </li>
      )}
      {isLoggedIn && (
        <li>
          <Link
            className={buttonStyles({ color: "primary" })}
            href="/planning"
          >
            Réserver un terrain
          </Link>
        </li>
      )}
    </ul>
  )
}
