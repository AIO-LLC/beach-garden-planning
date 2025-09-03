"use client"
import { Spinner } from "@heroui/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

function getAvailableDates(): { tuesday: string; thursday: string } {
  const today = new Date()
  const dow = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let tuesday: Date
  let thursday: Date

  // Monday (1), Tuesday (2), Wednesday (3) - Show this week's Tuesday and Thursday
  if (dow >= 1 && dow <= 3) {
    // Get this week's Tuesday
    tuesday = new Date(today)
    const daysToTuesday = 2 - dow // Can be negative if today is Wed
    tuesday.setDate(today.getDate() + daysToTuesday)
    
    // Get this week's Thursday
    thursday = new Date(today)
    const daysToThursday = 4 - dow
    thursday.setDate(today.getDate() + daysToThursday)
  }
  // Thursday (4) - Show today and next Tuesday
  else if (dow === 4) {
    thursday = new Date(today) // Today is Thursday
    
    tuesday = new Date(today)
    tuesday.setDate(today.getDate() + 5) // Next Tuesday
  }
  // Friday (5), Saturday (6), Sunday (0) - Show next week's Tuesday and Thursday
  else {
    // Calculate days until next Tuesday
    let daysUntilTuesday = dow === 0 ? 2 : (9 - dow) // Sunday: 2 days, Friday: 4, Saturday: 3
    
    tuesday = new Date(today)
    tuesday.setDate(today.getDate() + daysUntilTuesday)
    
    thursday = new Date(today)
    thursday.setDate(today.getDate() + daysUntilTuesday + 2)
  }

  return {
    tuesday: tuesday.toISOString().split("T")[0],
    thursday: thursday.toISOString().split("T")[0]
  }
}
function getDefaultDate(): string {
  const today = new Date()
  const dow = today.getDay()
  
  // If today is Tuesday or Thursday, use today
  if (dow === 2 || dow === 4) {
    return today.toISOString().split("T")[0]
  }
  
  // If Monday or Wednesday, use this week's Tuesday
  if (dow === 1 || dow === 3) {
    const tuesday = new Date(today)
    const daysToTuesday = 2 - dow
    tuesday.setDate(today.getDate() + daysToTuesday)
    return tuesday.toISOString().split("T")[0]
  }
  
  // If Friday, Saturday, or Sunday, use next Tuesday
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
