"use client"
import { Spinner } from "@heroui/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

function getAvailableDates(): { tuesday: string; thursday: string } {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  let tuesday: Date
  let thursday: Date

  if (dayOfWeek === 1 || dayOfWeek === 2) {
    // Monday or Tuesday - Show this week's Tuesday and Thursday
    tuesday = new Date(today)
    console.log(tuesday)
    const daysToTuesday = 2 - dayOfWeek // 1 for Monday, 0 for Tuesday
    tuesday.setDate(today.getDate() + daysToTuesday)

    thursday = new Date(today)
    const daysToThursday = 4 - dayOfWeek // 3 for Monday, 2 for Tuesday
    thursday.setDate(today.getDate() + daysToThursday)
  } else if (dayOfWeek === 3 || dayOfWeek === 4) {
    // Wednesday or Thursday - Show this week's Thursday and next week's Tuesday
    thursday = new Date(today)
    const daysToThursday = 4 - dayOfWeek // 1 for Wednesday, 0 for Thursday
    thursday.setDate(today.getDate() + daysToThursday)

    tuesday = new Date(today)
    const daysToNextTuesday = 7 - dayOfWeek + 2 // 6 for Wednesday, 5 for Thursday
    tuesday.setDate(today.getDate() + daysToNextTuesday)
  } else {
    // Friday, Saturday, or Sunday - Show next week's Tuesday and Thursday
    const daysToNextTuesday = dayOfWeek === 0 ? 3 : 10 - dayOfWeek // 2 for Sunday, 4 for Friday, 3 for Saturday

    tuesday = new Date(today)
    tuesday.setDate(today.getDate() + daysToNextTuesday)

    thursday = new Date(today)
    thursday.setDate(today.getDate() + daysToNextTuesday + 2)
  }

  return {
    tuesday: tuesday.toISOString().split("T")[0],
    thursday: thursday.toISOString().split("T")[0]
  }
}

function getDefaultDate(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()

  // If today is Tuesday or Thursday, use today
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    return today.toISOString().split("T")[0]
  }

  // If today is Wednesday, use this week's Thursday
  if (dayOfWeek === 3) {
    const thursday = new Date(today)
    thursday.setDate(today.getDate() + 1)
    return thursday.toISOString().split("T")[0]
  }

  // For all other days (Monday, Friday, Saturday, Sunday), return the soonest Tuesday
  const { tuesday } = getAvailableDates()
  return tuesday
}

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
