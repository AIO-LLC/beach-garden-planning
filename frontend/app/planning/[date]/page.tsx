"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button, Accordion, AccordionItem, addToast } from "@heroui/react"
import { notFound } from "next/navigation"
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io"
import { title } from "@/components/primitives"

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
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

function getAvailableDates(): { tuesday: string; thursday: string } {
  const today = new Date()
  const dow = today.getDay()
  let nextTue: Date, nextThu: Date

  if (dow === 2) {
    nextTue = new Date(today)
    nextThu = new Date(today)
    nextThu.setDate(today.getDate() + 2)
  } else if (dow === 4) {
    nextTue = new Date(today)
    nextTue.setDate(today.getDate() + 5)
    nextThu = new Date(today)
  } else {
    let delta = (2 - dow + 7) % 7
    if (delta === 0) delta = 7
    nextTue = new Date(today)
    nextTue.setDate(today.getDate() + delta)
    nextThu = new Date(nextTue)
    nextThu.setDate(nextTue.getDate() + 2)
  }

  return {
    tuesday: nextTue.toISOString().split("T")[0],
    thursday: nextThu.toISOString().split("T")[0]
  }
}

function isValidPlanningDate(d: string): boolean {
  const { tuesday, thursday } = getAvailableDates()
  return d === tuesday || d === thursday
}

function getDefaultDate(): string {
  const today = new Date()
  const dow = today.getDay()
  if (dow === 2 || dow === 4) {
    return today.toISOString().split("T")[0]
  }
  return getAvailableDates().tuesday
}

export default function PlanningDatePage() {
  const router = useRouter()
  const { date } = useParams() as { date?: string }
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [displayDate, setDisplayDate] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserHasReservation, setCurrentUserHasReservation] =
    useState(false)

  useEffect(() => {
    if (!date || !isValidPlanningDate(date)) {
      router.push(`/planning/${getDefaultDate()}`)
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
        const res = await fetch(`${API_HOST}:${API_PORT}/jwt-claims`, {
          method: "GET",
          credentials: "include"
        })
        if (res.ok) {
          const { id } = await res.json()
          setCurrentUserId(id)
        }
      } catch {}

      try {
        const res2 = await fetch(
          `${API_HOST}:${API_PORT}/reservations/${date}`,
          { method: "GET", credentials: "include" }
        )
        if (res2.ok) {
          setReservations(await res2.json())
        }
      } catch {}
    }

    fetchData()
  }, [date, router])

  useEffect(() => {
    setCurrentUserHasReservation(
      currentUserId != null &&
        reservations.some(r => r.member_id === currentUserId)
    )
  }, [reservations, currentUserId])

  const { tuesday, thursday } = getAvailableDates()
  const isFirst = date === tuesday
  const isSecond = date === thursday

  async function navTo(target: string) {
    router.push(`/planning/${target}`)
  }

  if (!displayDate) return null

  return (
    <div>
      <h1 className="font-bold text-xl my-4">Planning</h1>
      <p className="italic text-sm">
        Une seule réservation d’un terrain pour un créneau d’1h est possible par
        jour et au nom d’une seule personne.
      </p>
      <p className="italic text-sm mt-2">
        Les réservations ne sont disponibles que les mardis et jeudis.
      </p>

      <div className="flex justify-center items-center gap-4 my-4">
        <Button
          color="primary"
          size="sm"
          onClick={() => navTo(tuesday)}
          isDisabled={isFirst}
        >
          <IoIosArrowBack />
        </Button>

        <span className="font-semibold">{displayDate}</span>

        <Button
          color="primary"
          size="sm"
          onClick={() => navTo(thursday)}
          isDisabled={isSecond}
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
          return <span>Vous n'avez aucune réservation pour ce jour.</span>
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
                                await fetch(
                                  `${API_HOST}:${API_PORT}/reservation/${res.id}`,
                                  {
                                    method: "DELETE",
                                    credentials: "include"
                                  }
                                )
                                addToast({
                                  title: "Votre réservation a été annulée."
                                })
                                const refreshed = await (
                                  await fetch(
                                    `${API_HOST}:${API_PORT}/reservations/${date}`,
                                    { credentials: "include" }
                                  )
                                ).json()
                                setReservations(refreshed)
                              }}
                              isDisabled={false}
                            >
                              Annuler
                            </Button>
                          ) : (
                            <span className="text-gray-500">
                              Réservé par {res.member_first_name[0]}.{" "}
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
                              await fetch(
                                `${API_HOST}:${API_PORT}/reservation`,
                                {
                                  method: "POST",
                                  credentials: "include",
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
                              const refreshed = await (
                                await fetch(
                                  `${API_HOST}:${API_PORT}/reservations/${date}`,
                                  { credentials: "include" }
                                )
                              ).json()
                              setReservations(refreshed)
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
