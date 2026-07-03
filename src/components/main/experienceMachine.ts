import { mainSections, sectionOrder, type SectionKey } from '../../data/mainSections'

export type SequenceDirection = 'next' | 'prev'

export type MainExperienceState = {
  active: SectionKey
  direction: SequenceDirection | null
  openNode: SectionKey | null
}

export type MainExperienceAction =
  | { type: 'activate'; key: SectionKey }
  | { type: 'clear-direction' }
  | { type: 'close-node' }
  | { type: 'open-active' }
  | { type: 'shift'; direction: SequenceDirection }

export const initialMainExperienceState: MainExperienceState = {
  active: 'home',
  direction: null,
  openNode: null,
}

export function getSequenceIndex(key: SectionKey) {
  return sectionOrder.indexOf(key)
}

export function getSequenceView(state: MainExperienceState) {
  const activeIndex = getSequenceIndex(state.active)

  return {
    activeIndex,
    activeSection: mainSections[state.active],
    isNodeOpen: state.openNode !== null,
    sequenceCount: sectionOrder.length,
  }
}

export function reduceMainExperience(
  state: MainExperienceState,
  action: MainExperienceAction,
): MainExperienceState {
  switch (action.type) {
    case 'activate':
      return {
        active: action.key,
        direction: null,
        openNode: null,
      }
    case 'clear-direction':
      return {
        ...state,
        direction: null,
      }
    case 'close-node':
      return {
        ...state,
        openNode: null,
      }
    case 'open-active':
      return {
        ...state,
        openNode: state.active,
      }
    case 'shift': {
      const currentIndex = getSequenceIndex(state.active)
      const offset = action.direction === 'next' ? 1 : -1
      const nextIndex = (currentIndex + offset + sectionOrder.length) % sectionOrder.length

      return {
        active: sectionOrder[nextIndex],
        direction: action.direction,
        openNode: null,
      }
    }
    default:
      return state
  }
}
