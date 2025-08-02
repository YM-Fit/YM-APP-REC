// Main application component for the React version of the studio app.
// This file defines the core state, authentication, routing and page components.
// We aim to provide a cleaner, more intuitive user experience as recommended by
// professional guidelines for fitness apps: keep the interface consistent,
// intuitive and aligned with brand identity【60002966627165†L436-L449】.  The app
// stores its data (users, programs, sessions, groups, products) in
// localStorage so it works offline, similar to the original vanilla JS app.

import React, { useState, useEffect } from 'https://cdn.skypack.dev/react@18.2.0';

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
const SESSIONS_KEY = 'studio_sessions';
const GROUPS_KEY = 'studio_groups';
const PRODUCTS_KEY = 'studio_products';

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
        joinedSessions: [],
        joinedGroups: [],
        purchasedProducts: [],
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
        joinedSessions: [],
        joinedGroups: [],
        purchasedProducts: [],
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
      exercises: [
        { name: 'סקוואט', sets: 3, reps: 12, rest: '60', notes: 'שמור על גב ישר', video: '' },
        { name: 'לחיצת חזה', sets: 3, reps: 10, rest: '60', notes: '', video: '' }
      ]
    });
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
  }

  // Sessions
  let sessions = [];
  try {
    sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch (e) {
    sessions = [];
  }

  // Groups
  let groups = [];
  try {
    groups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
  } catch (e) {
    groups = [];
  }

  // Products
  let products = [];
  try {
    products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
  } catch (e) {
    products = [];
  }

  return { users, programs, sessions, groups, products };
}

// Save functions to persist to localStorage
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function savePrograms(programs) {
  localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function saveGroups(groups) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export default function App() {
  // Global state
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const { users: u, programs: p, sessions: s, groups: g, products: pr } = loadData();
    setUsers(u);
    setPrograms(p);
    setSessions(s);
    setGroups(g);
    setProducts(pr);
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
      saveSessions(sessions);
    }
  }, [sessions, loading]);
  useEffect(() => {
    if (!loading) {
      saveGroups(groups);
    }
  }, [groups, loading]);
  useEffect(() => {
    if (!loading) {
      saveProducts(products);
    }
  }, [products, loading]);

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
      joinedSessions: [],
      joinedGroups: [],
      purchasedProducts: [],
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
    const newProgram = { id: generateId(), name, description, exercises: [] };
    setPrograms([...programs, newProgram]);
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

  // Session operations
  const createSession = (title, date, time, capacity, description) => {
    const newSession = {
      id: generateId(),
      title,
      date,
      time,
      capacity: parseInt(capacity, 10),
      description,
      participants: []
    };
    setSessions([...sessions, newSession]);
  };
  const bookSession = (sessionId) => {
    if (!currentUser) return;
    setSessions(
      sessions.map((s) => {
        if (s.id === sessionId) {
          if (s.participants.includes(currentUser.id)) return s;
          if (s.participants.length >= s.capacity) return s;
          return { ...s, participants: [...s.participants, currentUser.id] };
        }
        return s;
      })
    );
    setUsers(
      users.map((u) => (u.id === currentUser.id ? { ...u, joinedSessions: [...u.joinedSessions, sessionId] } : u))
    );
  };

  // Group operations
  const createGroup = (title, date, time, capacity, description) => {
    const newGroup = {
      id: generateId(),
      title,
      date,
      time,
      capacity: parseInt(capacity, 10),
      description,
      members: []
    };
    setGroups([...groups, newGroup]);
  };
  const joinGroup = (groupId) => {
    if (!currentUser) return;
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          if (g.members.includes(currentUser.id) || g.members.length >= g.capacity) return g;
          return { ...g, members: [...g.members, currentUser.id] };
        }
        return g;
      })
    );
    setUsers(
      users.map((u) => (u.id === currentUser.id ? { ...u, joinedGroups: [...u.joinedGroups, groupId] } : u))
    );
  };

  // Product operations
  const createProduct = (name, price, description) => {
    const newProduct = {
      id: generateId(),
      name,
      price: parseFloat(price),
      description
    };
    setProducts([...products, newProduct]);
  };
  const purchaseProduct = (productId) => {
    if (!currentUser) return;
    const user = users.find((u) => u.id === currentUser.id);
    if (user.purchasedProducts.includes(productId)) return;
    setUsers(
      users.map((u) => (u.id === currentUser.id ? { ...u, purchasedProducts: [...u.purchasedProducts, productId] } : u))
    );
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
              />
            )}
            {activePage === 'programs' && (
              <ProgramsPage
                user={currentUser}
                programs={programs}
                addProgram={addProgram}
                assignProgram={assignProgramToUser}
                users={users}
              />
            )}
            {activePage === 'metrics' && (
              <MetricsPage user={currentUser} addMetric={addMetric} />
            )}
            {activePage === 'schedule' && (
              <SchedulePage
                user={currentUser}
                sessions={sessions}
                createSession={createSession}
                bookSession={bookSession}
              />
            )}
            {activePage === 'groups' && (
              <GroupsPage
                user={currentUser}
                groups={groups}
                createGroup={createGroup}
                joinGroup={joinGroup}
              />
            )}
            {activePage === 'store' && (
              <StorePage
                user={currentUser}
                products={products}
                createProduct={createProduct}
                purchaseProduct={purchaseProduct}
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
      <div className="navbar-brand">ברוך הבא, {currentUser.fullName || currentUser.username}</div>
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
        <li onClick={() => setActivePage('schedule')} className={activePage === 'schedule' ? 'active' : ''}>
          שיעורים
        </li>
        <li onClick={() => setActivePage('groups')} className={activePage === 'groups' ? 'active' : ''}>
          קבוצות
        </li>
        <li onClick={() => setActivePage('store')} className={activePage === 'store' ? 'active' : ''}>
          חנות
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
function Dashboard({ user, programs }) {
  const assignedProgram = programs.find((p) => p.id === user.assignedProgramId);
  const lastMetric = user.metrics.length ? user.metrics[user.metrics.length - 1] : null;
  return (
    <div className="dashboard">
      <h2>דשבורד</h2>
      {lastMetric ? (
        <div className="metric-summary">
          <p>נתוני המדידה האחרונה:</p>
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
          <p>התוכנית הנוכחית שלך:</p>
          <h4>{assignedProgram.name}</h4>
          <p>{assignedProgram.description}</p>
        </div>
      ) : (
        <p>לא הוקצתה לך תוכנית.</p>
      )}
    </div>
  );
}

// Programs page: trainers can create and assign programs; clients view their program
function ProgramsPage({ user, programs, addProgram, assignProgram, users }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
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
              <li key={p.id}><strong>{p.name}</strong> – {p.description}</li>
            ))}
          </ul>
        </div>
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
            <h4>תרגילים:</h4>
            <ul>
              {myProgram.exercises.map((ex, idx) => (
                <li key={idx}>{ex.name} - {ex.sets} סטים × {ex.reps} חזרות (מנוחה: {ex.rest} שניות)</li>
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

// Schedule page: trainers create sessions; clients book sessions
function SchedulePage({ user, sessions, createSession, bookSession }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title || !date || !time || !capacity) return;
    createSession(title, date, time, capacity, description);
    setTitle('');
    setDate('');
    setTime('');
    setCapacity('');
    setDescription('');
    setMessage('השיעור נוצר בהצלחה');
  };

  return (
    <div className="schedule-page">
      <h2>שיעורים</h2>
      {user.role === 'trainer' && (
        <form onSubmit={handleCreate} className="session-form">
          <h3>צור שיעור חדש</h3>
          <label>
            כותרת:
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            תאריך:
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            שעה:
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
          <label>
            קיבולת:
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
          </label>
          <label>
            תיאור:
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button type="submit">שמור שיעור</button>
          {message && <div className="message">{message}</div>}
        </form>
      )}
      <h3>כל השיעורים</h3>
      <ul className="sessions-list">
        {sessions.map((s) => (
          <li key={s.id} className="session-item">
            <div>
              <strong>{s.title}</strong> - {s.date} {s.time}
              <br />
              {s.description}
              <br />
              קיבולת: {s.participants.length}/{s.capacity}
            </div>
            {user.role === 'client' && (
              <button
                onClick={() => {
                  bookSession(s.id);
                }}
                disabled={s.participants.includes(user.id) || s.participants.length >= s.capacity}
              >
                {s.participants.includes(user.id) ? 'נרשמת' : s.participants.length >= s.capacity ? 'מלא' : 'הירשם'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Groups page: trainers create groups; clients join groups
function GroupsPage({ user, groups, createGroup, joinGroup }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title || !date || !time || !capacity) return;
    createGroup(title, date, time, capacity, description);
    setTitle('');
    setDate('');
    setTime('');
    setCapacity('');
    setDescription('');
    setMessage('הקבוצה נוצרה בהצלחה');
  };

  return (
    <div className="groups-page">
      <h2>קבוצות</h2>
      {user.role === 'trainer' && (
        <form onSubmit={handleCreate} className="group-form">
          <h3>צור קבוצה חדשה</h3>
          <label>
            כותרת:
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            תאריך:
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            שעה:
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
          <label>
            קיבולת:
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
          </label>
          <label>
            תיאור:
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button type="submit">שמור קבוצה</button>
          {message && <div className="message">{message}</div>}
        </form>
      )}
      <h3>כל הקבוצות</h3>
      <ul className="groups-list">
        {groups.map((g) => (
          <li key={g.id} className="group-item">
            <div>
              <strong>{g.title}</strong> - {g.date} {g.time}
              <br />
              {g.description}
              <br />
              קיבולת: {g.members.length}/{g.capacity}
            </div>
            {user.role === 'client' && (
              <button
                onClick={() => joinGroup(g.id)}
                disabled={g.members.includes(user.id) || g.members.length >= g.capacity}
              >
                {g.members.includes(user.id) ? 'הצטרפת' : g.members.length >= g.capacity ? 'מלא' : 'הצטרף'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Store page: trainers create products; clients buy products
function StorePage({ user, products, createProduct, purchaseProduct }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name || !price) return;
    createProduct(name, price, description);
    setName('');
    setPrice('');
    setDescription('');
    setMessage('המוצר נוצר בהצלחה');
  };

  return (
    <div className="store-page">
      <h2>חנות</h2>
      {user.role === 'trainer' && (
        <form onSubmit={handleCreate} className="product-form">
          <h3>הוסף מוצר חדש</h3>
          <label>
            שם מוצר:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            מחיר:
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </label>
          <label>
            תיאור:
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button type="submit">שמור מוצר</button>
          {message && <div className="message">{message}</div>}
        </form>
      )}
      <h3>כל המוצרים</h3>
      <ul className="products-list">
        {products.map((p) => (
          <li key={p.id} className="product-item">
            <div>
              <strong>{p.name}</strong> - {p.price} ₪
              <br />
              {p.description}
            </div>
            {user.role === 'client' && (
              <button
                onClick={() => purchaseProduct(p.id)}
                disabled={user.purchasedProducts.includes(p.id)}
              >
                {user.purchasedProducts.includes(p.id) ? 'נרכש' : 'רכוש'}
              </button>
            )}
          </li>
        ))}
      </ul>
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