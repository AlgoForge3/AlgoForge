import { create } from 'zustand'

export const useUserStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  
  // Backwards compatibility for Navbar (can be removed if fully refactored, but kept just in case)
  userLevel: JSON.parse(localStorage.getItem('user'))?.currentLevel || null,
  setUserLevel: (level) => set((state) => {
    if (state.user) {
      const updatedUser = { ...state.user, currentLevel: level };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { userLevel: level, user: updatedUser };
    }
    return { userLevel: level };
  }),

  // Auth specific methods
  login: (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
    set({ user: userData, token: token, userLevel: userData.currentLevel })
  },
  
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null, userLevel: null })
  },
}))
