"use client"

import { useRouter } from "next/navigation"

export default function PlanningPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0];
  router.push(`/planning/${today}`)
}
