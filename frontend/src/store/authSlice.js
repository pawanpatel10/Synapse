import { createSlice } from '@reduxjs/toolkit'

const storedUser = localStorage.getItem('synapse_user')
const storedToken = localStorage.getItem('synapse_token') || ''

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
    },
    clearCredentials: (state) => {
      state.user = null
      state.token = ''
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer