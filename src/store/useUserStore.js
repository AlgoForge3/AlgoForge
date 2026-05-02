import { create } from 'zustand'

export const useUserStore = create((set, get) => ({
  user:      JSON.parse(localStorage.getItem('user'))  || null,
  token:     localStorage.getItem('token')             || null,
  userLevel: JSON.parse(localStorage.getItem('user'))?.currentLevel || null,
  isGuest:   false,

  // ── Auth ────────────────────────────────────────────────────────────────
  login: (userData, token) => {
    localStorage.setItem('user',  JSON.stringify(userData))
    localStorage.setItem('token', token)
    set({ user: userData, token, userLevel: userData.currentLevel, isGuest: false })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null, userLevel: null, isGuest: false })
  },

  // ── Guest Mode ──────────────────────────────────────────────────────────
  setGuestMode: () => {
    set({
      isGuest:   true,
      user:      null,
      token:     null,
      userLevel: 'Beginner', // Guests default to Beginner level for recommendation
    })
  },

  exitGuestMode: () => {
    set({ isGuest: false, userLevel: null })
  },

  // ── Level ────────────────────────────────────────────────────────────────
  setUserLevel: (level) => set((state) => {
    if (state.user) {
      const updatedUser = { ...state.user, currentLevel: level }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return { userLevel: level, user: updatedUser }
    }
    return { userLevel: level }
  }),

  // ── Assessment Completed ────────────────────────────────────────────────
  /**
   * Called after assessment is saved to DB. Updates local state + localStorage
   * so the redirect logic in Login/Register knows not to redirect again.
   */
  setAssessmentCompleted: (level, score) => set((state) => {
    const updatedUser = {
      ...state.user,
      currentLevel:        level,
      assessmentCompleted: true,
      assessmentScore:     score,
    }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    return { user: updatedUser, userLevel: level }
  }),

  // ── Helpers ─────────────────────────────────────────────────────────────
  /** Whether the current logged-in user still needs to take the assessment */
  needsAssessment: () => {
    const state = get()
    if (!state.user || state.isGuest) return false
    return !state.user.assessmentCompleted
  },
}))
