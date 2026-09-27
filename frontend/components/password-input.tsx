'use client'
import { useId, useState, type ComponentProps } from 'react'

type Props = Omit<ComponentProps<'input'>, 'type'> & { visibilityLabel?: string }

export function PasswordInput({ id, disabled, style, visibilityLabel = 'password', ...props }: Props) {
  const generatedId = useId()
  const [visible, setVisible] = useState(false)
  const inputId = id || generatedId
  return <span className="relative block">
    <input {...props} id={inputId} disabled={disabled} type={visible ? 'text' : 'password'} style={{ ...style, paddingRight: '5rem' }} />
    <button type="button" disabled={disabled} aria-controls={inputId} aria-label={`${visible ? 'Hide' : 'Show'} ${visibilityLabel}`}
      onClick={() => setVisible(value => !value)}
      className="absolute inset-y-0 right-2 my-auto h-9 rounded px-2 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">
      {visible ? 'Hide' : 'Show'}
    </button>
  </span>
}
