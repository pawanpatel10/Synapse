import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../services/api.js'

const initialState = {
  items: [],
  status: 'idle',
  error: '',
}

export const fetchNotes = createAsyncThunk('notes/fetchNotes', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/api/notes')
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load notes')
  }
})

export const createNote = createAsyncThunk('notes/createNote', async (noteData, thunkAPI) => {
  try {
    const { data } = await api.post('/api/notes', noteData)
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create note')
  }
})

export const deleteNote = createAsyncThunk('notes/deleteNote', async (noteId, thunkAPI) => {
  try {
    await api.delete(`/api/notes/${noteId}`)
    return noteId
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete note')
  }
})

export const updateNote = createAsyncThunk('notes/updateNote', async ({ noteId, noteData }, thunkAPI) => {
  try {
    const { data } = await api.put(`/api/notes/${noteId}`, noteData)
    return data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update note')
  }
})

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearNotesState: (state) => {
      state.items = []
      state.status = 'idle'
      state.error = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.status = 'loading'
        state.error = ''
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Failed to load notes'
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items]
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.items = state.items.filter((note) => note._id !== action.payload)
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.items = state.items.map((note) => (note._id === action.payload._id ? action.payload : note))
      })
  },
})

export const { clearNotesState } = notesSlice.actions
export default notesSlice.reducer