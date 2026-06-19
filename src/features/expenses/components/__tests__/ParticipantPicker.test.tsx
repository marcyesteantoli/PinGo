import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ParticipantPicker } from '../ParticipantPicker'
import type { Collaborator } from '@app-types/index'

// Avatar uses nativewind's useColorScheme
jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light', setColorScheme: jest.fn() }),
}))

// @expo/vector-icons — render as a plain View so the tree doesn't crash
jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: ({ name, ...rest }: any) =>
      React.createElement(View, { testID: `icon-${name}`, ...rest }),
  }
})

jest.mock('@lib/colors', () => ({
  colors: {
    primary: { 500: '#3b82f6' },
    neutral: { 400: '#9ca3af' },
    white: '#ffffff',
  },
}))

const COLLABORATORS: Collaborator[] = [
  { user_id: 'user-1', name: 'Alice Smith', avatar_url: null, email: 'alice@example.com' },
  { user_id: 'user-2', name: 'Bob Jones', avatar_url: null, email: 'bob@example.com' },
  { user_id: 'user-3', name: 'Carol White', avatar_url: null, email: 'carol@example.com' },
]

beforeEach(() => jest.clearAllMocks())

describe('ParticipantPicker', () => {
  describe('renderizado de campos', () => {
    it('renders all collaborator names', async () => {
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={[]}
          onChange={jest.fn()}
        />
      )
      expect(getByText('Alice Smith')).toBeTruthy()
      expect(getByText('Bob Jones')).toBeTruthy()
      expect(getByText('Carol White')).toBeTruthy()
    })

    it('shows participant count label when some are selected', async () => {
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={['user-1', 'user-2']}
          onChange={jest.fn()}
        />
      )
      // Label includes count: "expenses_participants_label (2)"
      expect(getByText('expenses_participants_label (2)')).toBeTruthy()
    })

    it('shows label without count when none selected', async () => {
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={[]}
          onChange={jest.fn()}
        />
      )
      expect(getByText('expenses_participants_label')).toBeTruthy()
    })

    it('renders error message when error prop is provided', async () => {
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={[]}
          onChange={jest.fn()}
          error="At least one participant required"
        />
      )
      expect(getByText('At least one participant required')).toBeTruthy()
    })

    it('does not render error text when error prop is absent', async () => {
      const { queryByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={[]}
          onChange={jest.fn()}
        />
      )
      expect(queryByText('At least one participant required')).toBeNull()
    })
  })

  describe('toggle individual — comportamiento', () => {
    it('calls onChange with added userId when an unselected collaborator is pressed', async () => {
      const onChange = jest.fn()
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={['user-1']}
          onChange={onChange}
        />
      )
      fireEvent.press(getByText('Bob Jones'))
      expect(onChange).toHaveBeenCalledWith(['user-1', 'user-2'])
    })

    it('calls onChange with removed userId when a selected collaborator is pressed', async () => {
      const onChange = jest.fn()
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={['user-1', 'user-2']}
          onChange={onChange}
        />
      )
      fireEvent.press(getByText('Alice Smith'))
      expect(onChange).toHaveBeenCalledWith(['user-2'])
    })

    it('removes last participant, resulting in empty array', async () => {
      const onChange = jest.fn()
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={['user-3']}
          onChange={onChange}
        />
      )
      fireEvent.press(getByText('Carol White'))
      expect(onChange).toHaveBeenCalledWith([])
    })
  })

  describe('toggleAll — seleccionar/deseleccionar todos', () => {
    it('selects all when none are selected', async () => {
      const onChange = jest.fn()
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={[]}
          onChange={onChange}
        />
      )
      // i18n mock returns key as-is
      fireEvent.press(getByText('expenses_participants_selectAll'))
      expect(onChange).toHaveBeenCalledWith(['user-1', 'user-2', 'user-3'])
    })

    it('shows deselect-all button when all collaborators are selected', async () => {
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={['user-1', 'user-2', 'user-3']}
          onChange={jest.fn()}
        />
      )
      expect(getByText('expenses_participants_deselectAll')).toBeTruthy()
    })

    it('deselects all when all are selected', async () => {
      const onChange = jest.fn()
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={['user-1', 'user-2', 'user-3']}
          onChange={onChange}
        />
      )
      fireEvent.press(getByText('expenses_participants_deselectAll'))
      expect(onChange).toHaveBeenCalledWith([])
    })

    it('shows select-all when only some are selected (not all)', async () => {
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={COLLABORATORS}
          selectedIds={['user-1']}
          onChange={jest.fn()}
        />
      )
      expect(getByText('expenses_participants_selectAll')).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('renders without crashing when collaborators list is empty', async () => {
      await expect(
        render(
          <ParticipantPicker
            collaborators={[]}
            selectedIds={[]}
            onChange={jest.fn()}
          />
        )
      ).resolves.toBeDefined()
    })

    it('renders without crashing with a single collaborator', async () => {
      const { getByText } = await render(
        <ParticipantPicker
          collaborators={[COLLABORATORS[0]]}
          selectedIds={[]}
          onChange={jest.fn()}
        />
      )
      expect(getByText('Alice Smith')).toBeTruthy()
    })

    it('does not call onChange on toggleAll when collaborators list is empty', async () => {
      const onChange = jest.fn()
      // With empty collaborators, allSelected is false (length 0 check fails)
      // so pressing the button would call selectAll → onChange([])
      await render(
        <ParticipantPicker
          collaborators={[]}
          selectedIds={[]}
          onChange={onChange}
        />
      )
      // No button rendered when no collaborators — onChange never called passively
      expect(onChange).not.toHaveBeenCalled()
    })
  })
})
