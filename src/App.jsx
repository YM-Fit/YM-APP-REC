import React, { useState, useEffect } from 'react';

// Helper: generate a random ID for new records
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Helper: hash a password using the browser crypto API. Returns a hex string.
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Keys used in localStorage
const USERS_KEY = 'studio_users';
const PROGRAMS_KEY = 'studio_programs';
const WORKOUTS_KEY = 'studio_workouts';
const EXERCISES_KEY = 'studio_exercises';

// Load data from localStorage or initialize defaults
function loadData() {
  // Users
  let users = [];
  const usersJson = localStorage.getItem(USERS_KEY);
  if (usersJson) {
    try {
      users = JSON.parse(usersJson);
    } catch (e) {
      users = [];
    }
  }
  if (users.length === 0) {
    // default admin and client
    users = [
      {
        id: generateId(),
        username: 'admin',
        password: 'admin', // default plain text for simplicity
        role: 'trainer',
        fullName: 'מנהל סטודיו',
        email: '',
        phone: '',
        goals: {},
        waterGoal: 2,
        assignedProgramId: null,
        completedWorkouts: [],
        metrics: []
      },
      {
        id: generateId(),
        username: 'demo',
        password: 'demo',
        role: 'client',
        fullName: 'מתאמן דמו',
        email: '',
        phone: '',
        goals: {},
        waterGoal: 2,
        assignedProgramId: null,
        completedWorkouts: [],
        metrics: []
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Programs
  let programs = [];
  try {
    programs = JSON.parse(localStorage.getItem(PROGRAMS_KEY) || '[]');
  } catch (e) {
    programs = [];
  }
  if (programs.length === 0) {
    // add a basic program
    programs.push({
      id: generateId(),
      name: 'תוכנית בסיסית',
      description: 'תוכנית כללית לשיפור הכושר',
      difficulty: 'בינוני',
      duration: '45 דקות',
      targetMuscles: ['רגליים', 'חזה', 'גב'],
      exercises: [
        { 
          id: generateId(),
          name: 'סקוואט', 
          sets: 3, 
          reps: 12, 
          weight: 0,
          rest: 60, 
          notes: 'שמור על גב ישר', 
          muscleGroup: 'רגליים',
          video: '',
          completed: false
        },
        { 
          id: generateId(),
          name: 'לחיצת חזה', 
          sets: 3, 
          reps: 10, 
          weight: 0,
          rest: 60, 
          notes: 'נשימה נכונה', 
          muscleGroup: 'חזה',
          video: '',
          completed: false
        }
      ]
    });
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
  }

  // Workouts (completed workout sessions)
  let workouts = [];
  try {
    workouts = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
  } catch (e) {
    workouts = [];
  }

  // Exercise library
  let exercises = [];
  try {
    exercises = JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');
  } catch (e) {
    exercises = [];
  }
  if (exercises.length === 0) {
    // Default exercise library
    exercises = [
      { id: generateId(), name: 'סקוואט', muscleGroup: 'רגליים', equipment: 'משקל גוף' },
      { id: generateId(), name: 'לחיצת חזה', muscleGroup: 'חזה', equipment: 'משקולות' },
      { id: generateId(), name: 'משיכת גב', muscleGroup: 'גב', equipment: 'כבל' },
      { id: generateId(), name: 'לחיצת כתפיים', muscleGroup: 'כתפיים', equipment: 'משקולות' },
      { id: generateId(), name: 'סיבובי בטן', muscleGroup: 'בטן', equipment: 'משקל גוף' },
      { id: generateId(), name: 'דדליפט', muscleGroup: 'רגליים', equipment: 'משקולות' }
    ];
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  }

  return { users, programs, workouts, exercises };
}

// Save functions to persist to localStorage
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function savePrograms(programs) {
  localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
}

function saveWorkouts(workouts) {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

function saveExercises(exercises) {
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

export default function App() {
  // Global state
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const { users: u, programs: p, workouts: w, exercises: e } = loadData();
    setUsers(u);
    setPrograms(p);
    setWorkouts(w);
    setExercises(e);
    setLoading(false);
  }, []);

  // Persist changes when data arrays change
  useEffect(() => {
    if (!loading) {
      saveUsers(users);
    }
  }, [users, loading]);
  useEffect(() => {
    if (!loading) {
      savePrograms(programs);
    }
  }, [programs, loading]);
  useEffect(() => {
    if (!loading) {
      saveWorkouts(workouts);
    }
  }, [workouts, loading]);
  useEffect(() => {
    if (!loading) {
      saveExercises(exercises);
    }
  }, [exercises, loading]);

  // Authentication handlers
  const handleLogin = async (username, password) => {
    // Compare against stored users
    const user = users.find((u) => u.username === username);
    if (!user) return { success: false, message: 'משתמש לא נמצא' };
    // In this simplified version, passwords are stored plain; to upgrade security,
    // use hashPassword for both storage and comparison.
    let inputPass = password;
    // If user.password is hashed, we need to hash input
    if (user.password.length === 64) {
      inputPass = await hashPassword(password);
    }
    if (inputPass !== user.password) {
      return { success: false, message: 'סיסמה שגויה' };
    }
    setCurrentUser(user);
    setActivePage('dashboard');
    return { success: true };
  };

  const handleRegister = async (username, password, role) => {
    if (!username || !password) {
      return { success: false, message: 'נא למלא שם משתמש וסיסמה' };
    }
    if (users.find((u) => u.username === username)) {
      return { success: false, message: 'שם משתמש כבר קיים' };
    }
    // Hash password for new users
    const hashed = await hashPassword(password);
    const newUser = {
      id: generateId(),
      username,
      password: hashed,
      role,
      fullName: '',
      email: '',
      phone: '',
      goals: {},
      waterGoal: 2,
      assignedProgramId: null,
      completedWorkouts: [],
      metrics: []
    };
    setUsers([...users, newUser]);
    return { success: true, message: 'נרשמת בהצלחה' };
  };

  const logout = () => {
    setCurrentUser(null);
    setActivePage('dashboard');
  };

  // CRUD operations for programs
  const addProgram = (name, description) => {
    const newProgram = { 
      id: generateId(), 
      name, 
      description, 
      difficulty: 'בינוני',
      duration: '45 דקות',
      targetMuscles: [],
      exercises: [] 
    };
    setPrograms([...programs, newProgram]);
  };

  const updateProgram = (programId, updatedProgram) => {
    setPrograms(programs.map(p => p.id === programId ? updatedProgram : p));
  };

  const assignProgramToUser = (username, programId) => {
    setUsers(users.map((u) => (u.username === username ? { ...u, assignedProgramId: programId } : u)));
  };

  // Metrics operations
  const addMetric = (userId, entry) => {
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, metrics: [...u.metrics, entry] } : u))
    );
  };

  // Workout operations
  const completeWorkout = (programId, exerciseResults, notes) => {
    const workout = {
      id: generateId(),
      userId: currentUser.id,
      programId,
      date: new Date().toISOString(),
      exercises: exerciseResults,
      notes,
      duration: 0 // will be calculated
    };
    setWorkouts([...workouts, workout]);
    setUsers(
      users.map((u) => (u.id === currentUser.id ? { ...u, completedWorkouts: [...u.completedWorkouts, workout.id] } : u))
    );
  };

  // Exercise library operations
  const addExercise = (name, muscleGroup, equipment) => {
    const newExercise = {
      id: generateId(),
      name,
      muscleGroup,
      equipment
    };
    setExercises([...exercises, newExercise]);
  };

  // Profile update
  const saveProfile = (data) => {
    setUsers(
      users.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
    // also update currentUser state
    setCurrentUser({ ...currentUser, ...data });
  };

  if (loading) {
    return <div className="loading">טוען...</div>;
  }

  return (
    <div className="app-container">
      {currentUser ? (
        <>
          <Navbar
            currentUser={currentUser}
            activePage={activePage}
            setActivePage={setActivePage}
            logout={logout}
          />
          <div className="page-container">
            {activePage === 'dashboard' && (
              <Dashboard
                user={currentUser}
                programs={programs}
                workouts={workouts}
              />
            )}
            {activePage === 'programs' && (
              <ProgramsPage
                user={currentUser}
                programs={programs}
                exercises={exercises}
                addProgram={addProgram}
                updateProgram={updateProgram}
                assignProgram={assignProgramToUser}
                users={users}
              />
            )}
            {activePage === 'metrics' && (
              <MetricsPage user={currentUser} addMetric={addMetric} />
            )}
            {activePage === 'workouts' && (
              <WorkoutsPage
                user={currentUser}
                programs={programs}
                workouts={workouts}
                completeWorkout={completeWorkout}
              />
            )}
            {activePage === 'exercises' && (
              <ExercisesPage
                user={currentUser}
                exercises={exercises}
                addExercise={addExercise}
              />
            )}
            {activePage === 'profile' && (
              <ProfilePage user={currentUser} saveProfile={saveProfile} />
            )}
          </div>
        </>
      ) : (
        <AuthPage onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
}

// Navigation bar component
function Navbar({ currentUser, activePage, setActivePage, logout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">סטודיו YM - ברוך הבא, {currentUser.fullName || currentUser.username}</div>
      <ul className="nav-links">
        <li onClick={() => setActivePage('dashboard')} className={activePage === 'dashboard' ? 'active' : ''}>
          דשבורד
        </li>
        <li onClick={() => setActivePage('programs')} className={activePage === 'programs' ? 'active' : ''}>
          תוכניות
        </li>
        <li onClick={() => setActivePage('metrics')} className={activePage === 'metrics' ? 'active' : ''}>
          מדדים
        </li>
        <li onClick={() => setActivePage('workouts')} className={activePage === 'workouts' ? 'active' : ''}>
          אימונים
        </li>
        <li onClick={() => setActivePage('exercises')} className={activePage === 'exercises' ? 'active' : ''}>
          ספריית תרגילים
        </li>
        <li onClick={() => setActivePage('profile')} className={activePage === 'profile' ? 'active' : ''}>
          פרופיל
        </li>
        <li onClick={logout}>התנתק</li>
      </ul>
    </nav>
  );
}

// Authentication page component: handles login and registration forms
function AuthPage({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const result = await onLogin(username.trim(), password);
      if (!result.success) {
        setMessage(result.message);
      }
    } else {
      const result = await onRegister(username.trim(), password, role);
      setMessage(result.message);
      if (result.success) {
        setIsLogin(true);
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'התחברות' : 'הרשמה'}</h2>
      <form onSubmit={submit} className="auth-form">
        <label>
          שם משתמש:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          סיסמה:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {!isLogin && (
          <label>
            תפקיד:
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">לקוח</option>
              <option value="trainer">מאמן</option>
            </select>
          </label>
        )}
        <button type="submit">{isLogin ? 'התחבר' : 'צור חשבון'}</button>
        {message && <div className="message">{message}</div>}
      </form>
      <div className="toggle-link" onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
        {isLogin ? 'אין לך חשבון? לחץ כאן להרשמה' : 'כבר רשום? לחץ כאן להתחברות'}
      </div>
    </div>
  );
}

// Dashboard page: shows summary of user's metrics and assigned program
function Dashboard({ user, programs, workouts }) {
  const assignedProgram = programs.find((p) => p.id === user.assignedProgramId);
  const lastMetric = user.metrics.length ? user.metrics[user.metrics.length - 1] : null;
  const userWorkouts = workouts.filter(w => w.userId === user.id);
  const thisWeekWorkouts = userWorkouts.filter(w => {
    const workoutDate = new Date(w.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo;
  });

  return (
    <div className="dashboard">
      <h2>דשבורד - סטודיו YM</h2>
      
      <div className="workout-summary">
        <h3>סיכום אימונים</h3>
        <p>אימונים השבוע: {thisWeekWorkouts.length}</p>
        <p>סה"כ אימונים: {userWorkouts.length}</p>
      </div>

      {lastMetric ? (
        <div className="metric-summary">
          <h3>נתוני המדידה האחרונה:</h3>
          <ul>
            <li>משקל: {lastMetric.weight}</li>
            <li>אחוז שומן: {lastMetric.bodyFat}</li>
            <li>חזה: {lastMetric.chest}</li>
            <li>מותניים: {lastMetric.waist}</li>
            <li>תאריך: {lastMetric.date}</li>
          </ul>
        </div>
      ) : (
        <p>אין מדידות עדיין.</p>
      )}

      {assignedProgram ? (
        <div className="program-summary">
          <h3>התוכנית הנוכחית שלך:</h3>
          <h4>{assignedProgram.name}</h4>
          <p>{assignedProgram.description}</p>
          <p>רמת קושי: {assignedProgram.difficulty}</p>
          <p>משך זמן: {assignedProgram.duration}</p>
        </div>
      ) : (
        <p>לא הוקצתה לך תוכנית.</p>
      )}
    </div>
  );
}

// Programs page: trainers can create and assign programs; clients view their program
function ProgramsPage({ user, programs, exercises, addProgram, updateProgram, assignProgram, users }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('בינוני');
  const [duration, setDuration] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [editingProgram, setEditingProgram] = useState(null);
  const [message, setMessage] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name) return;
    addProgram(name, description);
    setName('');
    setDescription('');
    setMessage('תוכנית נוצרה בהצלחה');
  };

  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedProgram) return;
    assignProgram(selectedUser, selectedProgram);
    setSelectedUser('');
    setSelectedProgram('');
    setMessage('התוכנית הוקצתה בהצלחה');
  };

  const addExerciseToProgram = (programId, exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    const program = programs.find(p => p.id === programId);
    const newExercise = {
      id: generateId(),
      name: exercise.name,
      sets: 3,
      reps: 10,
      weight: 0,
      rest: 60,
      notes: '',
      muscleGroup: exercise.muscleGroup,
      completed: false
    };
    
    const updatedProgram = {
      ...program,
      exercises: [...program.exercises, newExercise]
    };
    updateProgram(programId, updatedProgram);
  };

  if (user.role === 'trainer') {
    return (
      <div className="programs-page">
        <h2>ניהול תוכניות</h2>
        <form onSubmit={handleCreate} className="program-form">
          <h3>צור תוכנית חדשה</h3>
          <label>
            שם:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            תיאור:
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            רמת קושי:
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="קל">קל</option>
              <option value="בינוני">בינוני</option>
              <option value="קשה">קשה</option>
            </select>
          </label>
          <button type="submit">שמור</button>
        </form>
        <form onSubmit={handleAssign} className="assign-form">
          <h3>הקצה תוכנית למשתמש</h3>
          <label>
            מתאמן:
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">בחר משתמש</option>
              {users.filter((u) => u.role === 'client').map((u) => (
                <option key={u.id} value={u.username}>{u.username}</option>
              ))}
            </select>
          </label>
          <label>
            תוכנית:
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
              <option value="">בחר תוכנית</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="submit">הקצה</button>
        </form>
        {message && <div className="message">{message}</div>}
        <div className="programs-list">
          <h3>כל התוכניות</h3>
          <ul>
            {programs.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.name}</strong> – {p.description}
                  <br />
                  רמת קושי: {p.difficulty} | משך זמן: {p.duration}
                  <br />
                  תרגילים: {p.exercises.length}
                </div>
                <button onClick={() => setEditingProgram(p)}>ערוך תוכנית</button>
              </li>
            ))}
          </ul>
        </div>
        
        {editingProgram && (
          <ProgramEditor 
            program={editingProgram}
            exercises={exercises}
            updateProgram={updateProgram}
            addExerciseToProgram={addExerciseToProgram}
            onClose={() => setEditingProgram(null)}
          />
        )}
      </div>
    );
  } else {
    // client view: show assigned program details
    const myProgram = programs.find((p) => p.id === user.assignedProgramId);
    return (
      <div className="programs-page">
        <h2>התוכנית שלי</h2>
        {myProgram ? (
          <div className="program-details">
            <h3>{myProgram.name}</h3>
            <p>{myProgram.description}</p>
            <p>רמת קושי: {myProgram.difficulty}</p>
            <p>משך זמן: {myProgram.duration}</p>
            <h4>תרגילים:</h4>
            <ul>
              {myProgram.exercises.map((ex, idx) => (
                <li key={idx}>
                  <strong>{ex.name}</strong> - {ex.sets} סטים × {ex.reps} חזרות
                  {ex.weight > 0 && ` - ${ex.weight} ק"ג`}
                  <br />
                  מנוחה: {ex.rest} שניות | קבוצת שרירים: {ex.muscleGroup}
                  {ex.notes && <br />}
                  {ex.notes && <em>הערות: {ex.notes}</em>}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>לא הוקצתה לך תוכנית.</p>
        )}
      </div>
    );
  }
}

// Program Editor Component
function ProgramEditor({ program, exercises, updateProgram, addExerciseToProgram, onClose }) {
  const [selectedExercise, setSelectedExercise] = useState('');
  
  const removeExerciseFromProgram = (exerciseId) => {
    const updatedProgram = {
      ...program,
      exercises: program.exercises.filter(e => e.id !== exerciseId)
    };
    updateProgram(program.id, updatedProgram);
  };
  
  const updateExerciseInProgram = (exerciseId, field, value) => {
    const updatedProgram = {
      ...program,
      exercises: program.exercises.map(e => 
        e.id === exerciseId ? { ...e, [field]: value } : e
      )
    };
    updateProgram(program.id, updatedProgram);
  };

  return (
    <div className="program-editor">
      <h3>עריכת תוכנית: {program.name}</h3>
      
      <div className="add-exercise">
        <h4>הוסף תרגיל</h4>
        <select 
          value={selectedExercise} 
          onChange={(e) => setSelectedExercise(e.target.value)}
        >
          <option value="">בחר תרגיל</option>
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscleGroup})</option>
          ))}
        </select>
        <button 
          onClick={() => {
            if (selectedExercise) {
              addExerciseToProgram(program.id, selectedExercise);
              setSelectedExercise('');
            }
          }}
        >
          הוסף תרגיל
        </button>
      </div>
      
      <div className="exercises-list">
        <h4>תרגילים בתוכנית</h4>
        {program.exercises.map(ex => (
          <div key={ex.id} className="exercise-editor">
            <h5>{ex.name}</h5>
            <div className="exercise-params">
              <label>
                סטים:
                <input 
                  type="number" 
                  value={ex.sets} 
                  onChange={(e) => updateExerciseInProgram(ex.id, 'sets', parseInt(e.target.value))}
                />
              </label>
              <label>
                חזרות:
                <input 
                  type="number" 
                  value={ex.reps} 
                  onChange={(e) => updateExerciseInProgram(ex.id, 'reps', parseInt(e.target.value))}
                />
              </label>
              <label>
                משקל (ק"ג):
                <input 
                  type="number" 
                  value={ex.weight} 
                  onChange={(e) => updateExerciseInProgram(ex.id, 'weight', parseFloat(e.target.value))}
                />
              </label>
              <label>
                מנוחה (שניות):
                <input 
                  type="number" 
                  value={ex.rest} 
                  onChange={(e) => updateExerciseInProgram(ex.id, 'rest', parseInt(e.target.value))}
                />
              </label>
            </div>
            <label>
              הערות:
              <textarea 
                value={ex.notes} 
                onChange={(e) => updateExerciseInProgram(ex.id, 'notes', e.target.value)}
              />
            </label>
            <button onClick={() => removeExerciseFromProgram(ex.id)}>הסר תרגיל</button>
          </div>
        ))}
      </div>
      
      <button onClick={onClose}>סגור עורך</button>
    </div>
  );
}

// Metrics page: form to add metrics and list of all metrics
function MetricsPage({ user, addMetric }) {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [message, setMessage] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!weight) return;
    const entry = {
      date: new Date().toLocaleDateString('he-IL'),
      weight: parseFloat(weight),
      bodyFat: parseFloat(bodyFat || '0'),
      chest: parseFloat(chest || '0'),
      waist: parseFloat(waist || '0')
    };
    addMetric(user.id, entry);
    setWeight('');
    setBodyFat('');
    setChest('');
    setWaist('');
    setMessage('המדידה נשמרה בהצלחה');
  };

  return (
    <div className="metrics-page">
      <h2>מדדים</h2>
      <form onSubmit={submit} className="metric-form">
        <label>
          משקל (ק"ג):
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} required />
        </label>
        <label>
          אחוז שומן (%):
          <input type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
        </label>
        <label>
          חזה (ס"מ):
          <input type="number" value={chest} onChange={(e) => setChest(e.target.value)} />
        </label>
        <label>
          מותניים (ס"מ):
          <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} />
        </label>
        <button type="submit">שמור מדידה</button>
        {message && <div className="message">{message}</div>}
      </form>
      <h3>היסטוריית מדידות</h3>
      <table className="metrics-table">
        <thead>
          <tr>
            <th>תאריך</th>
            <th>משקל</th>
            <th>אחוז שומן</th>
            <th>חזה</th>
            <th>מותניים</th>
          </tr>
        </thead>
        <tbody>
          {user.metrics.map((m, idx) => (
            <tr key={idx}>
              <td>{m.date}</td>
              <td>{m.weight}</td>
              <td>{m.bodyFat}</td>
              <td>{m.chest}</td>
              <td>{m.waist}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Workouts page: track and complete workouts
function WorkoutsPage({ user, programs, workouts, completeWorkout }) {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [workoutInProgress, setWorkoutInProgress] = useState(null);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [message, setMessage] = useState('');

  const userWorkouts = workouts.filter(w => w.userId === user.id);
  const availablePrograms = user.role === 'trainer' ? programs : programs.filter(p => p.id === user.assignedProgramId);

  const startWorkout = (programId) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    
    setWorkoutInProgress(program);
    setExerciseResults(program.exercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: ex.sets,
      completedSets: [],
      notes: ''
    })));
  };

  const completeSet = (exerciseIndex, setIndex, reps, weight) => {
    const newResults = [...exerciseResults];
    if (!newResults[exerciseIndex].completedSets[setIndex]) {
      newResults[exerciseIndex].completedSets[setIndex] = {};
    }
    newResults[exerciseIndex].completedSets[setIndex] = { reps: parseInt(reps), weight: parseFloat(weight) };
    setExerciseResults(newResults);
  };

  const finishWorkout = () => {
    completeWorkout(workoutInProgress.id, exerciseResults, workoutNotes);
    setWorkoutInProgress(null);
    setExerciseResults([]);
    setWorkoutNotes('');
    setMessage('האימון הושלם בהצלחה!');
  };

  return (
    <div className="workouts-page">
      <h2>אימונים</h2>
      
      {!workoutInProgress ? (
        <>
          <div className="start-workout">
            <h3>התחל אימון</h3>
            <select 
              value={selectedProgram} 
              onChange={(e) => setSelectedProgram(e.target.value)}
            >
              <option value="">בחר תוכנית אימון</option>
              {availablePrograms.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button 
              onClick={() => startWorkout(selectedProgram)}
              disabled={!selectedProgram}
            >
              התחל אימון
            </button>
          </div>
          
          <div className="workout-history">
            <h3>היסטוריית אימונים</h3>
            {userWorkouts.length === 0 ? (
              <p>עדיין לא השלמת אימונים</p>
            ) : (
              <ul>
                {userWorkouts.slice(-10).reverse().map(w => {
                  const program = programs.find(p => p.id === w.programId);
                  return (
                    <li key={w.id}>
                      <strong>{program?.name || 'תוכנית לא ידועה'}</strong>
                      <br />
                      תאריך: {new Date(w.date).toLocaleDateString('he-IL')}
                      <br />
                      תרגילים: {w.exercises.length}
                      {w.notes && <><br />הערות: {w.notes}</>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="workout-in-progress">
          <h3>אימון בתהליך: {workoutInProgress.name}</h3>
          
          {workoutInProgress.exercises.map((exercise, exerciseIndex) => (
            <div key={exercise.id} className="exercise-tracking">
              <h4>{exercise.name}</h4>
              <p>יעד: {exercise.sets} סטים × {exercise.reps} חזרות</p>
              {exercise.weight > 0 && <p>משקל מומלץ: {exercise.weight} ק"ג</p>}
              
              <div className="sets-tracking">
                {Array.from({ length: exercise.sets }, (_, setIndex) => (
                  <div key={setIndex} className="set-input">
                    <span>סט {setIndex + 1}:</span>
                    <input 
                      type="number" 
                      placeholder="חזרות"
                      onChange={(e) => completeSet(exerciseIndex, setIndex, e.target.value, 
                        exerciseResults[exerciseIndex]?.completedSets[setIndex]?.weight || 0)}
                    />
                    <input 
                      type="number" 
                      placeholder="משקל (ק״ג)"
                      onChange={(e) => completeSet(exerciseIndex, setIndex, 
                        exerciseResults[exerciseIndex]?.completedSets[setIndex]?.reps || 0, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              {exercise.notes && <p><em>הערות: {exercise.notes}</em></p>}
            </div>
          ))}
          
          <div className="workout-notes">
            <label>
              הערות לאימון:
              <textarea 
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="איך הרגשת? מה הלך טוב? מה אפשר לשפר?"
              />
            </label>
          </div>
          
          <div className="workout-actions">
            <button onClick={finishWorkout}>סיים אימון</button>
            <button onClick={() => setWorkoutInProgress(null)}>בטל אימון</button>
          </div>
        </div>
      )}
      
      {message && <div className="message">{message}</div>}
    </div>
  );
}

// Exercises page: manage exercise library
function ExercisesPage({ user, exercises, addExercise }) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [message, setMessage] = useState('');

  const muscleGroups = ['חזה', 'גב', 'כתפיים', 'רגליים', 'בטן', 'זרועות', 'ישבן'];
  const equipmentTypes = ['משקל גוף', 'משקולות', 'כבל', 'מכונה', 'אלסטיק', 'כדור רפואי'];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !muscleGroup || !equipment) return;
    addExercise(name, muscleGroup, equipment);
    setName('');
    setMuscleGroup('');
    setEquipment('');
    setMessage('התרגיל נוסף בהצלחה');
  };

  return (
    <div className="exercises-page">
      <h2>ספריית תרגילים</h2>
      
      {user.role === 'trainer' && (
        <form onSubmit={handleAdd} className="exercise-form">
          <h3>הוסף תרגיל חדש</h3>
          <label>
            שם התרגיל:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            קבוצת שרירים:
            <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} required>
              <option value="">בחר קבוצת שרירים</option>
              {muscleGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </label>
          <label>
            ציוד נדרש:
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)} required>
              <option value="">בחר ציוד</option>
              {equipmentTypes.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </label>
          <button type="submit">הוסף תרגיל</button>
          {message && <div className="message">{message}</div>}
        </form>
      )}
      
      <div className="exercises-library">
        <h3>כל התרגילים</h3>
        <div className="exercises-grid">
          {muscleGroups.map(group => (
            <div key={group} className="muscle-group-section">
              <h4>{group}</h4>
              <ul>
                {exercises
                  .filter(ex => ex.muscleGroup === group)
                  .map(ex => (
                    <li key={ex.id}>
                      <strong>{ex.name}</strong>
                      <br />
                      ציוד: {ex.equipment}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Profile page: allows user to update basic info and goals
function ProfilePage({ user, saveProfile }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [weightGoal, setWeightGoal] = useState(user.goals?.weight || '');
  const [bodyFatGoal, setBodyFatGoal] = useState(user.goals?.bodyFat || '');
  const [chestGoal, setChestGoal] = useState(user.goals?.chest || '');
  const [waistGoal, setWaistGoal] = useState(user.goals?.waist || '');
  const [waterGoal, setWaterGoal] = useState(user.waterGoal || 2);
  const [message, setMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const data = {
      fullName,
      email,
      phone,
      goals: {
        weight: weightGoal ? parseFloat(weightGoal) : undefined,
        bodyFat: bodyFatGoal ? parseFloat(bodyFatGoal) : undefined,
        chest: chestGoal ? parseFloat(chestGoal) : undefined,
        waist: waistGoal ? parseFloat(waistGoal) : undefined
      },
      waterGoal: waterGoal ? parseFloat(waterGoal) : 0
    };
    saveProfile(data);
    setMessage('הפרופיל נשמר בהצלחה');
  };

  return (
    <div className="profile-page">
      <h2>פרופיל</h2>
      <form onSubmit={handleSave} className="profile-form">
        <label>
          שם מלא:
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label>
          אימייל:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          טלפון:
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <fieldset className="goals-section">
          <legend>יעדים</legend>
          <label>
            משקל יעד:
            <input type="number" value={weightGoal} onChange={(e) => setWeightGoal(e.target.value)} />
          </label>
          <label>
            אחוז שומן יעד:
            <input type="number" value={bodyFatGoal} onChange={(e) => setBodyFatGoal(e.target.value)} />
          </label>
          <label>
            היקף חזה יעד:
            <input type="number" value={chestGoal} onChange={(e) => setChestGoal(e.target.value)} />
          </label>
          <label>
            היקף מותניים יעד:
            <input type="number" value={waistGoal} onChange={(e) => setWaistGoal(e.target.value)} />
          </label>
        </fieldset>
        <label>
          יעד שתייה יומית (ליטר):
          <input type="number" value={waterGoal} onChange={(e) => setWaterGoal(e.target.value)} />
        </label>
        <button type="submit">שמור פרופיל</button>
        {message && <div className="message">{message}</div>}
      </form>
    </div>
  );
}