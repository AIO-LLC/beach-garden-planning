"use client"
import { Spinner } from "@heroui/react"
import { useRouter } from "next/navigation"

function getNextTuesdayOrThursday(): string {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // If today is Tuesday (2) or Thursday (4), use today
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    return today.toISOString().split("T")[0]
  }

  // If today is Wednesday (3), redirect to Thursday
  if (dayOfWeek === 3) {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  // For all other days, find the next Tuesday
  let daysUntilTuesday = (2 - dayOfWeek + 7) % 7
  if (daysUntilTuesday === 0) daysUntilTuesday = 7 // If today is Tuesday, get next Tuesday

  const nextTuesday = new Date(today)
  nextTuesday.setDate(today.getDate() + daysUntilTuesday)
  return nextTuesday.toISOString().split("T")[0]
}

export default function PlanningPage() {
  const router = useRouter()
  const defaultDate = getNextTuesdayOrThursday()
  router.replace(`/planning/${defaultDate}`)

  return (
    <>
      <Spinner className="mt-8" size="lg" />
    </>
  )
}
