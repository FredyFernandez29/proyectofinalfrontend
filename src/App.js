import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css'; // Importamos los estilos

// ============================================================
// 1. CONTEXTO DE AUTENTICACIÓN
// ============================================================
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (correo, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, { correo, password });
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(usuario);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error de conexión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ============================================================
// 2. COMPONENTE NAVBAR
// ============================================================
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <span className="navbar-brand">🎫 Ticket System</span>
      <span className="navbar-rol">Rol: {user?.rol || 'invitado'}</span>
      <Link to="/tickets">Tickets</Link>
      {user?.rol === 'admin' && <Link to="/usuarios">Usuarios</Link>}
      <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
    </nav>
  );
};

// ============================================================
// 3. COMPONENTE LOGIN
// ============================================================
const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(correo, password);
    if (result.success) {
      navigate('/tickets');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '450px', marginTop: '80px' }}>
      <div className="card">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              placeholder="tu@email.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }}>Ingresar</button>
          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 4. COMPONENTE LISTA DE TICKETS
// ============================================================
const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/tickets`);
        setTickets(res.data);
      } catch (error) {
        console.error('Error al cargar tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este ticket?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/tickets/${id}`);
        setTickets(tickets.filter(t => t.id !== id));
      } catch (error) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const getEstadoBadge = (estado) => {
    const map = {
      'abierto': 'badge-abierto',
      'en progreso': 'badge-en progreso',
      'cerrado': 'badge-cerrado'
    };
    return `badge ${map[estado] || ''}`;
  };

  const getPrioridadBadge = (prioridad) => {
    const map = {
      'baja': 'badge-baja',
      'media': 'badge-media',
      'alta': 'badge-alta'
    };
    return `badge ${map[prioridad] || ''}`;
  };

  if (loading) return <div className="loading">Cargando tickets...</div>;

  return (
    <div className="app-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Mis Tickets</h2>
          <Link to="/tickets/nuevo">
            <button className="btn">➕ Nuevo Ticket</button>
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="empty">No hay tickets disponibles.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.titulo}</td>
                    <td><span className={getEstadoBadge(t.estado)}>{t.estado}</span></td>
                    <td><span className={getPrioridadBadge(t.prioridad)}>{t.prioridad}</span></td>
                    <td>{t.asignado_a?.nombre || 'Sin asignar'}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/tickets/editar/${t.id}`}>
                          <button className="btn btn-secondary btn-sm">Editar</button>
                        </Link>
                        {user?.rol === 'admin' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 5. COMPONENTE FORMULARIO DE TICKET
// ============================================================
const TicketForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    asignado_a: ''
  });
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.rol === 'admin' || user?.rol === 'tecnico') {
      axios.get(`${process.env.REACT_APP_API_URL}/usuarios`)
        .then(res => setUsuarios(res.data))
        .catch(err => console.error('Error al cargar usuarios:', err));
    }

    if (isEdit) {
      axios.get(`${process.env.REACT_APP_API_URL}/tickets`)
        .then(res => {
          const ticket = res.data.find(t => t.id === parseInt(id));
          if (ticket) {
            setFormData({
              titulo: ticket.titulo,
              descripcion: ticket.descripcion || '',
              prioridad: ticket.prioridad,
              asignado_a: ticket.asignado_a?.id || ''
            });
          }
        })
        .catch(err => console.error('Error al cargar ticket:', err));
    }
  }, [id, user, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${process.env.REACT_APP_API_URL}/tickets/${id}`, formData);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/tickets`, formData);
      }
      navigate('/tickets');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar el ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '700px' }}>
      <div className="card">
        <h2>{isEdit ? 'Editar Ticket' : 'Nuevo Ticket'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              name="titulo"
              className="form-control"
              placeholder="Título del ticket"
              value={formData.titulo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              className="form-control"
              placeholder="Describe el problema"
              value={formData.descripcion}
              onChange={handleChange}
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>Prioridad</label>
            <select
              name="prioridad"
              className="form-control"
              value={formData.prioridad}
              onChange={handleChange}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
            <div className="form-group">
              <label>Asignar a</label>
              <select
                name="asignado_a"
                className="form-control"
                value={formData.asignado_a}
                onChange={handleChange}
              >
                <option value="">Sin asignar</option>
                {usuarios
                  .filter(u => u.rol === 'tecnico' || u.rol === 'admin')
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                  ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/tickets">
              <button type="button" className="btn btn-secondary">Cancelar</button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 6. COMPONENTE PRINCIPAL APP
// ============================================================
function App() {
  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading">Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tickets" element={<ProtectedRoute><TicketsList /></ProtectedRoute>} />
          <Route path="/tickets/nuevo" element={<ProtectedRoute><TicketForm /></ProtectedRoute>} />
          <Route path="/tickets/editar/:id" element={<ProtectedRoute><TicketForm /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/tickets" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
