import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { HelpModal } from './HelpModal.tsx'

describe('HelpModal', () => {
  it('renders content when open is true', () => {
    const { getByRole } = render(<HelpModal open={true} onClose={() => {}} />)
    expect(getByRole('dialog')).toBeTruthy()
  })

  it('is not in the DOM when open is false', () => {
    const { queryByRole } = render(<HelpModal open={false} onClose={() => {}} />)
    expect(queryByRole('dialog')).toBeNull()
  })

  it('contains all five mode names', () => {
    const { getByText } = render(<HelpModal open={true} onClose={() => {}} />)
    expect(getByText('Select')).toBeTruthy()
    expect(getByText('Add Node')).toBeTruthy()
    expect(getByText('Add Edge')).toBeTruthy()
    expect(getByText('Simulate')).toBeTruthy()
    expect(getByText('Delete')).toBeTruthy()
  })

  it('contains keyboard shortcuts S, N, E, R, D and Ctrl+Z', () => {
    const { getByText } = render(<HelpModal open={true} onClose={() => {}} />)
    expect(getByText('S')).toBeTruthy()
    expect(getByText('N')).toBeTruthy()
    expect(getByText('E')).toBeTruthy()
    expect(getByText('R')).toBeTruthy()
    expect(getByText('D')).toBeTruthy()
    expect(getByText('Ctrl+Z')).toBeTruthy()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    const { getByTitle } = render(<HelpModal open={true} onClose={onClose} />)
    fireEvent.click(getByTitle('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<HelpModal open={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
