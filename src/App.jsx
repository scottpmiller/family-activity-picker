import React, { useEffect, useMemo, useState } from 'react'
import Select from 'react-select';
import { API } from './api.js'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, Container, Typography, Button, Drawer, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

// Create a Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5', // Your custom indigo
    },
    secondary: {
      main: '#3730a3', // Your custom dark indigo
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 1px 1px rgba(0,0,0,.04)',
          padding: '10px 14px',
        },
        contained: {
          backgroundColor: '#4f46e5',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#4338ca',
          }
        },
        outlined: {
          backgroundColor: '#e0e7ff',
          color: '#3730a3',
          borderColor: '#c7d2fe',
          '&:hover': {
            backgroundColor: '#c7d2fe',
            borderColor: '#c7d2fe',
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '9999px',
          fontSize: '0.75rem',
          height: '20px',
          backgroundColor: '#f1f5f9',
          color: '#334155',
          border: '1px solid #e2e8f0',
        }
      }
    }
  }
})

export default function App(){
  const [trip, setTrip] = useState({ title: '', description: '' })
  const [attendees, setAttendees] = useState([])
  const [activities, setActivities] = useState([])
  const [selections, setSelections] = useState([])
  const [selectedAttendee, setSelectedAttendee] = useState()
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [editingTrip, setEditingTrip] = useState(false)
  const [editingActivity, setEditingActivity] = useState(false)
  
  useEffect(() => {
    (async () => {
      try {
        const [tripData, activitiesData, selectionsData, attendeesData] = await Promise.all([
          API.getTrip(),
          API.listActivities(),
          API.getSelections(),
          API.getAttendees()
        ])
        
        setTrip(tripData || { title: '', description: '' })
        setActivities(activitiesData || [])
        setSelections(selectionsData || [])
        setAttendees(attendeesData || [])
        setSelectedAttendee(attendeesData?.[0])
      } catch (error) {
        console.error('Failed to load data:', error)
        // Set fallback values
        setTrip({ title: '', description: '' })
        setActivities([])
        setSelections([])
        setAttendees([])
      }
    })()
  }, [])

  async function toggleSelection(a, flag){
    if (!selectedAttendee || !a) return
    
    try {
      const updatedSelection = await API.toggleSelection({ 
        attendee_id: selectedAttendee.id, 
        activity_id: a.id, 
        selected: flag 
      })
      
      const existingSelection = selections.find(s => s.activity_id === a.id && s.attendee_id === selectedAttendee.id )
      if (existingSelection) {
        setSelections(selections.map(s => s.activity_id === a.id && s.attendee_id === selectedAttendee.id ? { ...s, selected: flag } : s))
      } else {
        setSelections(selections.concat(updatedSelection))
      }
    } catch (error) {
      console.error('Failed to toggle selection:', error)
    }
  }

  function openDrawer(item){
    setSelectedActivity(item || null)
    setEditingActivity(true)
  }
  function closeDrawer(){ 
    setEditingActivity(false)
    setSelectedActivity(null) 
  }

  async function saveActivity(form){
    if (selectedActivity && selectedActivity.id){
      await API.upsertActivity({ ...selectedActivity, ...form })
      .then(activity => {
        setActivities(activities.map(a => a.id === activity.id ? activity : a))
      })
    } else {
      await API.upsertActivity(form)
      .then(activity => {
        setActivities(activities.concat(activity))
      })
    }
    closeDrawer()
  }

  async function deleteActivity(){
    if (!selectedActivity || !selectedActivity.id) return
    await API.deleteActivity(selectedActivity.id).then(() => {
      setActivities(activities.filter(a => a.id !== selectedActivity.id))
    })
    closeDrawer()
  }

  async function saveTrip(form){
    await API.saveTrip(form).then(t => {
      setTrip(t)
      setEditingTrip(false)
    })
  }

  const pickedByMap = useMemo(() => {
    const map = new Map()
    
    if (!Array.isArray(selections) || !Array.isArray(attendees)) return map
    
    selections.forEach(selection => {
      if (!selection?.selected) return
      
      const activityId = String(selection.activity_id)
      const attendee = attendees.find(a => a && a.id === selection.attendee_id)
      
      if (!attendee) return // Skip if attendee not found
      
      if (!map.has(activityId)) {
        map.set(activityId, [])
      }
      map.get(activityId).push(attendee)
    })
    
    return map
  }, [selections, attendees])

  const selectedIds = useMemo(() => {
    if (!selectedAttendee || !Array.isArray(selections)) return new Set()
    
    return new Set(
      selections
        .filter(selection => selection.attendee_id === selectedAttendee.id && selection.selected)
        .map(selection => String(selection.activity_id))
    )
  }, [selectedAttendee, selections])


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
            <span className="text-2xl">🎒</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{trip.title || ''}</h1>
            <p className="text-slate-600">{trip.description || ''}</p>
          </div>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => openDrawer(null)}>
            Add Activity
          </Button>
          <Button variant="outlined" onClick={() => setEditingTrip(true)}>
            Edit Trip
          </Button>
        </Box>
      </header>

      <section className="mt-6 flex flex-wrap gap-3 items-center">
        <div className="card flex items-center gap-2">
          <span className="text-sm">Your name:</span>
          <Select
            value={selectedAttendee ? { label: selectedAttendee.name, value: selectedAttendee.id } : null}
            isClearable={false}
            isSearchable={true}
            name="name"
            onChange={e=>setSelectedAttendee(attendees.find(a => a.id === e.value))}
            options={attendees.map(a => ({ label: a.name, value: a.id }))}
          />
        </div>
        <div className="flex-1" />
      </section>

      <section className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map(a => (
          <ActivityCard
            key={a.id}
            a={a}
            selected={selectedIds.has(String(a.id))}
            pickedBy={pickedByMap.get(String(a.id)) || []}
            onToggle={(flag) => toggleSelection(a, flag)}
            onEdit={() => openDrawer(a)}
            disabled={selectedAttendee?.name.trim() === ''}
          />
        ))}
      </section>

      <Drawer
        anchor="right"
        open={editingTrip}
        onClose={() => setEditingTrip(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            maxWidth: '90vw',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="h3">
              Edit Trip
            </Typography>
            <IconButton onClick={() => setEditingTrip(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <TripForm
              initial={{ title: trip.title || '', description: trip.description || '' }}
              onCancel={() => setEditingTrip(false)}
              onSave={saveTrip}
            />
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={editingActivity}
        onClose={() => setEditingActivity(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            maxWidth: '90vw',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="h3">
              {selectedActivity ? 'Edit Activity' : 'New Activity'}
            </Typography>
            <IconButton onClick={() => setEditingActivity(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <ActivityForm
              initial={selectedActivity || { title: '', description: '', link: '', image_url: '', completed: false }}
              trip={trip}
              onSave={saveActivity}
            />
          </Box>
          
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={deleteActivity}
              sx={{ display: selectedActivity ? 'block' : 'none' }}
            >
              Delete
            </Button>
            <Box sx={{ flex: 1 }} />
          </Box>
        </Box>
      </Drawer>
      </Container>
    </ThemeProvider>
  )
}

function ActivityCard({ a, selected, onToggle, onEdit, pickedBy, disabled }){
  return (
    <article className="card flex flex-col gap-3" style={{ opacity: a.completed ? 0.6 : 1 }}>
      {a.image_url ? (
        <img src={a.image_url} alt="" className="rounded-xl h-40 w-full object-cover border border-slate-200" />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="pr-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold" style={{ textDecoration: a.completed ? 'line-through' : 'none' }}>
              {a.title || 'Untitled activity'}
            </h3>
            {a.completed && <span className="text-green-600 text-xl">✓</span>}
          </div>
          <p className="text-slate-600 text-sm">{a.description || ''}</p>
          {a.link ? (
            <a className="text-indigo-700 underline text-sm" href={a.link} target="_blank" rel="noreferrer">Learn more ↗</a>
          ) : null}
        </div>
        <label className="flex items-center gap-2 select-none">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={!!selected}
            onChange={e => onToggle(e.target.checked)}
            disabled={disabled}
            aria-label="Select activity"
          />
        </label>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1">
        {pickedBy && pickedBy.length ? (
          <>
            <span className="text-xs text-slate-600 mr-1">Picked by:</span>
            {pickedBy.filter(attendee => attendee && attendee.id).map((attendee, i) => (
              <span key={attendee.id} className="chip">{attendee.name}</span>
            ))}
          </>
        ) : (
          <span className="text-xs text-slate-400">No picks yet</span>
        )}
      </div>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, marginTop: 'auto' }}>
        <Button variant="outlined" onClick={onEdit}>
          Edit
        </Button>
      </Box>
    </article>
  )
}

function TripForm({ initial, onCancel, onSave }){
  const [title, setTitle] = useState(initial.title || '')
  const [description, setDescription] = useState(initial.description || '')
  return (
    <div>
      <div className="space-y-3">
        <label className="label">Title</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Trip title" />
        <label className="label">Description</label>
        <textarea className="input" rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Trip description" />
      </div>
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onSave({ title, description })}>
          Save
        </Button>
      </Box>
    </div>
  )
}

function ActivityForm({ initial, trip, onSave }){
  const [title, setTitle] = useState(initial.title || '')
  const [description, setDescription] = useState(initial.description || '')
  const [link, setLink] = useState(initial.link || '')
  const [image_url, setImageUrl] = useState(initial.image_url || '')
  const [completed, setCompleted] = useState(initial.completed || false)

  useEffect(() => {
    setTitle(initial.title || '')
    setDescription(initial.description || '')
    setLink(initial.link || '')
    setImageUrl(initial.image_url || '')
    setCompleted(initial.completed || false)
  }, [initial])

  return (
    <div className="space-y-3">
      <label className="label">Title</label>
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Zoo Trip" />
      <label className="label">Description</label>
      <textarea className="input" rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short details" />
      <label className="label">Link (optional)</label>
      <input className="input" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
      <label className="label">Image URL (optional)</label>
      <input className="input" value={image_url} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
      <Box sx={{ pt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={completed}
            onChange={e => setCompleted(e.target.checked)}
          />
          <span className="text-sm">Mark as completed</span>
        </label>
      </Box>
      <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => onSave({
             title: title.trim(),
             description: description.trim(),
             link: link.trim(),
             image_url: image_url.trim(),
             trip_id: trip.id,
             completed: completed
          })}
        >
          Save
        </Button>
      </Box>
    </div>
  )
}
