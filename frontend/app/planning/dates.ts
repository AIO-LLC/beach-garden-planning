export function getAvailableDates(): { tuesday: string; thursday: string } {
  const today = new Date()
  console.log(today)
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
    const daysToNextTuesday = dayOfWeek === 0 ? 2 : 9 - dayOfWeek // 2 for Sunday, 4 for Friday, 3 for Saturday

    tuesday = new Date(today)
    tuesday.setDate(today.getDate() + daysToNextTuesday)

    thursday = new Date(today)
    thursday.setDate(today.getDate() + daysToNextTuesday + 2)
  }

  return {
    tuesday: formatLocalDate(tuesday),
    thursday: formatLocalDate(thursday)
  }
}

// Helper function to format date in local timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getDefaultDate(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()

  // If today is Tuesday or Thursday, use today
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    return formatLocalDate(today)
  }

  // If today is Wednesday, use this week's Thursday
  if (dayOfWeek === 3) {
    const thursday = new Date(today)
    thursday.setDate(today.getDate() + 1)
    return formatLocalDate(thurday)
  }

  // For all other days (Monday, Friday, Saturday, Sunday), return the soonest Tuesday
  const { tuesday } = getAvailableDates()
  return tuesday
}

export function isValidPlanningDate(d: string): boolean {
  const { tuesday, thursday } = getAvailableDates()
  return d === tuesday || d === thursday
}

export function getNavigationDates(currentDate: string): {
  prevDate: string | null
  nextDate: string | null
} {
  const { tuesday, thursday } = getAvailableDates()

  // Determine chronological order of the two available dates
  const tuesdayDate = new Date(tuesday)
  const thursdayDate = new Date(thursday)
  const isThursdayAfterTuesday = thursdayDate > tuesdayDate

  if (isThursdayAfterTuesday) {
    // Normal case: Tuesday comes first, then Thursday
    if (currentDate === tuesday) {
      return { prevDate: null, nextDate: thursday }
    } else if (currentDate === thursday) {
      return { prevDate: tuesday, nextDate: null }
    }
  } else {
    // Special case: Thursday comes first (this week), then Tuesday (next week)
    if (currentDate === thursday) {
      return { prevDate: null, nextDate: tuesday }
    } else if (currentDate === tuesday) {
      return { prevDate: thursday, nextDate: null }
    }
  }

  return { prevDate: null, nextDate: null }
}
