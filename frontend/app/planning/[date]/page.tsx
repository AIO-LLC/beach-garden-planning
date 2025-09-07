"use client"

import { Spinner } from "@heroui/react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button, Accordion, AccordionItem, addToast } from "@heroui/react"
import { notFound } from "next/navigation"
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io"
import { title } from "@/components/primitives"
import { useAuth, authenticatedFetch } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

type Reservation = {
  id: string
  member_id: string
  court_number: number
  reservation_time: number
  reservation_date: string
  member_first_name: string
  member_last_name: string
}

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT
const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

function getAvailableDates(): { tuesday: string; thursday: string } {
  const today = new Date()
  console.log(today)
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  console.log(dayOfWeek)

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

function isValidPlanningDate(d: string): boolean {
  const { tuesday, thursday } = getAvailableDates()
  return d === tuesday || d === thursday
}

function getNavigationDates(currentDate: string): { prevDate: string | null; nextDate: string | null } {
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

export default function PlanningDatePage() {
  const router = useRouter()
  const auth = useAuth({
    requireAuth: true,
    requireProfile: true,
    redirectTo: "/"
  })
  const { date } = useParams() as { date?: string }
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [displayDate, setDisplayDate] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserHasReservation, setCurrentUserHasReservation] =
    useState(false)

  useEffect(() => {
    if (!date || !isValidPlanningDate(date)) {
      router.replace(`/planning/${getDefaultDate()}`)
      return
    }

    const [y, m, d] = date.split("-").map(Number)
    const dt = new Date(y, m - 1, d)
    setDisplayDate(
      dt.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long"
      })
    )

    async function fetchData() {
      try {
        // Use the userId from auth state if available
        if (auth.userId) {
          setCurrentUserId(auth.userId)
        }

        // Fetch reservations using authenticated fetch
        const res2 = await authenticatedFetch(
          `${API_URL}/reservations/${date}`,
          {
            method: "GET"
          }
        )

        if (res2.ok) {
          setReservations(await res2.json())
        }
      } catch (error) {
        console.error("Error fetching reservations:", error)
        addToast({
          title: "Erreur lors du chargement des réservations",
          color: "danger"
        })
      }
    }

    if (!auth.isLoading && auth.isLoggedIn) {
      fetchData()
    }
  }, [date, auth.isLoading, auth.isLoggedIn, auth.userId])

  useEffect(() => {
    setCurrentUserHasReservation(
      currentUserId != null &&
        reservations.some(r => r.member_id === currentUserId)
    )
  }, [reservations, currentUserId])

  const { prevDate, nextDate } = getNavigationDates(date || "")

  async function navTo(target: string) {
    router.push(`/planning/${target}`)
  }

  if (!displayDate) return null

  if (!reservations || auth.isLoading) {
    return (
      <>
        <Spinner className="mt-8" size="lg" />
      </>
    )
  }

  return (
    <div>
      <h1 className="font-bold text-xl my-4">Planning</h1>
      <p className="italic text-sm">
        Une seule réservation d&apos;un terrain pour un créneau d&apos;1h est
        possible par jour et au nom d&apos;une seule personne.
      </p>
      <p className="italic text-sm mt-2">
        Les réservations ne sont disponibles que les mardis et jeudis.
      </p>

      <div className="flex justify-center items-center gap-4 my-4">
        <Button
          color="primary"
          size="sm"
          onClick={() => prevDate && navTo(prevDate)}
          isDisabled={!prevDate}
        >
          <IoIosArrowBack />
        </Button>

        <span className="font-semibold">{displayDate}</span>

        <Button
          color="primary"
          size="sm"
          onClick={() => nextDate && navTo(nextDate)}
          isDisabled={!nextDate}
        >
          <IoIosArrowForward />
        </Button>
      </div>

      <div className="mb-4 text-center">
        {(() => {
          const currentReservation = reservations.find(
            r => r.member_id === currentUserId
          )
          if (currentReservation) {
            return (
              <span className="text-green-600">
                Vous avez réservé le{" "}
                <b>terrain {currentReservation.court_number}</b> à{" "}
                <b>{currentReservation.reservation_time}h</b>.
              </span>
            )
          }
          return <span>Vous n&apos;avez aucune réservation pour ce jour.</span>
        })()}
      </div>

      <Accordion variant="splitted">
        {[16, 17, 18, 19, 20].map(hour => {
          const total = 4
          const used = reservations.filter(
            r => r.reservation_time === hour
          ).length
          const free = total - used
          let subtitle = `${free}/${total} terrains libres`
          if (free === 1) subtitle = `1/${total} terrain libre`
          if (free === 0) subtitle = "Aucun terrain disponible"

          return (
            <AccordionItem
              key={hour}
              aria-label={`${hour}h`}
              title={`${hour}h`}
              subtitle={subtitle}
            >
              <div>
                <span>Terrains</span>
                {[1, 2, 3, 4].map(court => {
                  const res = reservations.find(
                    r => r.reservation_time === hour && r.court_number === court
                  )
                  return (
                    <div
                      key={court}
                      className="w-full flex justify-between items-center mt-2 ml-2"
                    >
                      <span>{court}</span>
                      {res ? (
                        <div className="flex items-center gap-2">
                          {currentUserId === res.member_id ? (
                            <Button
                              color="danger"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await authenticatedFetch(
                                    `${API_URL}/reservation/${res.id}`,
                                    {
                                      method: "DELETE"
                                    }
                                  )
                                  addToast({
                                    title: "Votre réservation a été annulée.",
                                    color: "success"
                                  })
                                  const refreshed = await authenticatedFetch(
                                    `${API_URL}/reservations/${date}`,
                                    { method: "GET" }
                                  )
                                  if (refreshed.ok) {
                                    setReservations(await refreshed.json())
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error canceling reservation:",
                                    error
                                  )
                                  addToast({
                                    title: "Erreur lors de l'annulation",
                                    color: "danger"
                                  })
                                }
                              }}
                              isDisabled={false}
                            >
                              Annuler
                            </Button>
                          ) : (
                            <span className="text-gray-500">
                              Réservé par {res.member_first_name}{" "}
                              {res.member_last_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        !currentUserHasReservation && (
                          <Button
                            color="primary"
                            size="sm"
                            onClick={async () => {
                              try {
                                await authenticatedFetch(
                                  `${API_URL}/reservation`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                      id: "",
                                      member_id: currentUserId,
                                      court_number: court,
                                      reservation_date: date,
                                      reservation_time: hour
                                    })
                                  }
                                )
                                addToast({
                                  title: "Votre réservation a été enregistrée.",
                                  color: "success"
                                })
                                const refreshed = await authenticatedFetch(
                                  `${API_URL}/reservations/${date}`,
                                  { method: "GET" }
                                )
                                if (refreshed.ok) {
                                  setReservations(await refreshed.json())
                                }
                              } catch (error) {
                                console.error(
                                  "Error making reservation:",
                                  error
                                )
                                addToast({
                                  title: "Erreur lors de la réservation",
                                  color: "danger"
                                })
                              }
                            }}
                            isDisabled={false}
                          >
                            Réserver
                          </Button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
