import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

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
// 2. COMPONENTE: NAVBAR
// ============================================================
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', gap: '20px', padding: '10px', background: '#f0f0f0' }}>
      <span><strong>Ticket System</strong> - Rol: {user?.rol || 'invitado'}</span>
      <Link to="/tickets">Tickets</Link>
      {user?.rol === 'admin' && <Link to="/usuarios">Usuarios</Link>}
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </nav>
  );
};

// ============================================================
// 3. COMPONENTE: LOGIN
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
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 20px' }}>Ingresar</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>
    </div>
  );
};

// ============================================================
// 4. COMPONENTE: LISTA DE TICKETS
// ============================================================
const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/tickets`);
        setTickets(res.data);
      } catch (error) {
        console.error('Error al cargar tickets:', error);
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

  return (
    <div style={{ padding: '20px' }}>
      <h2>Mis Tickets</h2>
      <Link to="/tickets/nuevo">
        <button style={{ marginBottom: '15px' }}>Crear Nuevo Ticket</button>
      </Link>
      <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Asignado a</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr><td colSpan="6">No hay tickets.</td></tr>
          ) : (
            tickets.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.titulo}</td>
                <td>{t.estado}</td>
                <td>{t.prioridad}</td>
                <td>{t.asignado_a?.nombre || 'Sin asignar'}</td>
                <td>
                  <Link to={`/tickets/editar/${t.id}`} style={{ marginRight: '10px' }}>Editar</Link>
                  {user?.rol === 'admin' && (
                    <button onClick={() => handleDelete(t.id)}>Eliminar</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// 5. COMPONENTE: FORMULARIO DE TICKET (CREAR/EDITAR)
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

  useEffect(() => {
    // Cargar lista de usuarios (para asignar)
    if (user?.rol === 'admin' || user?.rol === 'tecnico') {
      axios.get(`${process.env.REACT_APP_API_URL}/usuarios`)
        .then(res => setUsuarios(res.data))
        .catch(err => console.error('Error al cargar usuarios:', err));
    }

    // Si estamos editando, cargar datos del ticket
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
  }, [id, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`${process.env.REACT_APP_API_URL}/tickets/${id}`, formData);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/tickets`, formData);
      }
      navigate('/tickets');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar el ticket');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>{isEdit ? 'Editar Ticket' : 'Nuevo Ticket'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Título:</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label>Descripción:</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="4"
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label>Prioridad:</label>
          <select
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
          <div>
            <label>Asignar a:</label>
            <select
              name="asignado_a"
              value={formData.asignado_a}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
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
        <button type="submit" style={{ padding: '8px 20px' }}>Guardar</button>
      </form>
    </div>
  );
};

// ============================================================
// 6. COMPONENTE PRINCIPAL APP (CON RUTAS)
// ============================================================
function App() {
  // Componente para rutas protegidas
  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/nuevo"
            element={
              <ProtectedRoute>
                <TicketForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/editar/:id"
            element={
              <ProtectedRoute>
                <TicketForm />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/tickets" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;