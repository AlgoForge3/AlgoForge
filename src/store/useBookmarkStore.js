import { create } from 'zustand'

const STORAGE_KEY = 'algoforge_bookmarks'

const loadBookmarks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const useBookmarkStore = create((set, get) => ({
  bookmarks: loadBookmarks(),

  toggle: (problemNumber) => {
    const current = get().bookmarks
    const next = current.includes(problemNumber)
      ? current.filter(n => n !== problemNumber)
      : [...current, problemNumber]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    set({ bookmarks: next })
  },

  isBookmarked: (problemNumber) => get().bookmarks.includes(problemNumber),
}))
