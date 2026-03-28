import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { useStore } from './store.ts'
import { seedGraph } from './seed.ts'
import { Toolbar } from './Toolbar.tsx'
import type { AppMode } from './store.ts'

describe('Toolbar mode switcher', () => {
  let setMode: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setMode = vi.fn()
    useStore.setState({ graph: seedGraph, mode: 'select', setMode } as Parameters<typeof useStore.setState>[0])
  })

  const modes: AppMode[] = ['select', 'add-node', 'add-edge', 'simulate', 'delete']

  it('renders a button for each of the five modes', () => {
    const { getByTitle } = render(<Toolbar />)
    expect(getByTitle('Select')).toBeTruthy()
    expect(getByTitle('Add Node')).toBeTruthy()
    expect(getByTitle('Add Edge')).toBeTruthy()
    expect(getByTitle('Simulate')).toBeTruthy()
    expect(getByTitle('Delete')).toBeTruthy()
  })

  it.each(modes)('clicking %s button calls setMode with %s', async (mode) => {
    const titleMap: Record<AppMode, string> = {
      select: 'Select',
      'add-node': 'Add Node',
      'add-edge': 'Add Edge',
      simulate: 'Simulate',
      delete: 'Delete',
    }
    const { getByTitle } = render(<Toolbar />)
    await act(async () => {
      fireEvent.click(getByTitle(titleMap[mode]))
    })
    expect(setMode).toHaveBeenCalledWith(mode)
  })

  it('active mode button has distinct styling', () => {
    useStore.setState({ mode: 'simulate' } as Parameters<typeof useStore.setState>[0])
    const { getByTitle } = render(<Toolbar />)
    const simulateBtn = getByTitle('Simulate') as HTMLButtonElement
    const selectBtn = getByTitle('Select') as HTMLButtonElement
    // active button should have a non-transparent background
    expect(simulateBtn.style.background).not.toBe('transparent')
    expect(selectBtn.style.background).toBe('transparent')
  })
})
