"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Une erreur est survenue. Veuillez réessayer plus tard.</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Recharger
      </button>
    </div>
  )
}
