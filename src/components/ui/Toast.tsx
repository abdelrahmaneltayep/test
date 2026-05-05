import { useEffect } from 'react'
import styles from './Toast.module.css'

interface Props {
  message: string
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 4000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(t)
  }, [onDismiss, durationMs])

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  )
}
