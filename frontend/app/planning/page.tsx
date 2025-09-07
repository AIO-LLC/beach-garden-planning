"use client"
import { Spinner } from "@heroui/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getDefaultDate } from "./dates"

export default function PlanningPage() {
  const auth = useAuth({ requireAuth: true, requireProfile: true })
  const router = useRouter()

  const defaultDate = getDefaultDate()
  router.replace(`/planning/${defaultDate}`)

  return (
    <>
      <Spinner className="mt-8" size="lg" />
    </>
  )
}
