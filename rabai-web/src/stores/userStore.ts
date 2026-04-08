// User Store - 用户认证状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: 'free' | 'pro' | 'enterprise'
  createdAt?: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const isPro = computed(() => user.value?.role === 'pro' || user.value?.role === 'enterprise')
  const isEnterprise = computed(() => user.value?.role === 'enterprise')
  const userName = computed(() => user.value?.name || 'Guest')
  const userAvatar = computed(() => user.value?.avatar || null)

  // Actions
  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  const loadFromStorage = () => {
    try {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('user_info')

      if (savedToken) {
        token.value = savedToken
      }

      if (savedUser) {
        user.value = JSON.parse(savedUser)
      }
    } catch {
      // Ignore errors
    }
  }

  const saveToStorage = () => {
    try {
      if (token.value) {
        localStorage.setItem('auth_token', token.value)
      }
      if (user.value) {
        localStorage.setItem('user_info', JSON.stringify(user.value))
      }
    } catch {
      // Ignore errors
    }
  }

  const login = async (email: string, password: string) => {
    isLoading.value = true
    try {
      // This would typically call an API
      // For now, just simulate a login
      const mockUser: User = {
        id: '1',
        name: email.split('@')[0],
        email,
        role: 'free'
      }
      user.value = mockUser
      token.value = 'mock_token_' + Date.now()
      saveToStorage()
      return { success: true }
    } catch (e) {
      return { success: false, error: 'Login failed' }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      saveToStorage()
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    // Getters
    isLoggedIn,
    isPro,
    isEnterprise,
    userName,
    userAvatar,
    // Actions
    setUser,
    setToken,
    loadFromStorage,
    saveToStorage,
    login,
    logout,
    updateProfile
  }
})
