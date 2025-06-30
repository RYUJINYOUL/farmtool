"use client"

import ErrorMessage from "@/components/error"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

const TreeError = ({ error, reset }: ErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <ErrorMessage />
      <Button onClick={() => reset()}>다시 시도</Button>
    </div>
  )
}

export default TreeError
