import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// ============================
// 1. CONTEXTO DE AUTENTICACIÓN
// ============================
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

// ============================
// 2. SISTEMA DE NOTIFICACIONES (Toast)
// ============================
const ToastContext = createContext();

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={toastStyles.container}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ ...toastStyles.toast, ...toastStyles[toast.type] }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

const toastStyles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  toast: {
    padding: '12px 20px',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'slideIn 0.3s ease-out',
    minWidth: '250px',
    maxWidth: '400px',
  },
  success: { backgroundColor: '#28a745' },
  error: { backgroundColor: '#dc3545' },
  info: { backgroundColor: '#17a2b8' },
};

// Inyectar animación CSS global
const globalStyles = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }
`;

// ============================
// 3. ESTILOS GLOBALES
// ============================
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  },
  cardHover: {
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.2s, transform 0.15s',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
    transform: 'scale(1.02)',
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '10px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputFocus: {
    borderColor: '#80bdff',
    boxShadow: '0 0 0 0.2rem rgba(0,123,255,0.25)',
  },
  label: {
    fontWeight: '600',
    display: 'block',
    marginBottom: '5px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    background: '#f8f9fa',
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #dee2e6',
  },
  nav: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    padding: '10px 20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  link: {
    textDecoration: 'none',
    color: '#007bff',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#6c757d',
  },
};

// ============================
// 4. COMPONENTES
// ============================

// --- Navbar ---
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.nav}>
      <span><strong>🎫 Ticket System</strong></span>
      <span style={{ marginLeft: 'auto' }}>Rol: <strong>{user?.rol || 'invitado'}</strong></span>
      <Link to="/tickets" style={styles.link}>Mis Tickets</Link>
      {user?.rol === 'admin' && <Link to="/usuarios" style={styles.link}>Usuarios</Link>}
      <button onClick={handleLogout} style={styles.button}>Cerrar Sesión</button>
    </div>
  );
};

// --- Login ---
const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(correo, password);
    setLoading(false);
    if (result.success) {
      showToast('Bienvenido, has iniciado sesión correctamente', 'success');
      navigate('/tickets');
    } else {
      setError(result.message);
      showToast(result.message, 'error');
    }
  };

  return (
    <div style={{ ...styles.container, maxWidth: '400px', marginTop: '80px' }}>
      <div style={styles.card} className="fade-in">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

// --- TicketsList ---
const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tickets`);
      setTickets(res.data);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      showToast('No se pudieron cargar los tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este ticket?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/tickets/${id}`);
        setTickets(tickets.filter(t => t.id !== id));
        showToast('Ticket eliminado correctamente', 'success');
      } catch (error) {
        showToast(error.response?.data?.message || 'Error al eliminar', 'error');
      }
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'abierto': '#28a745',
      'en progreso': '#ffc107',
      'cerrado': '#6c757d'
    };
    return colores[estado] || '#6c757d';
  };

  if (loading) return <div style={styles.loading}>Cargando tickets...</div>;

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Mis Tickets</h2>
        <Link to="/tickets/nuevo">
          <button style={styles.button}>+ Crear Nuevo Ticket</button>
        </Link>
      </div>

      <div style={styles.card} className="fade-in">
        {tickets.length === 0 ? (
          <p>No tienes tickets. ¡Crea uno nuevo!</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Título</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Prioridad</th>
                <th style={styles.th}>Asignado a</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className="fade-in" style={{ transition: 'background 0.2s' }}>
                  <td style={styles.td}>{t.id}</td>
                  <td style={styles.td}>
                    <Link to={`/tickets/${t.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                      {t.titulo}
                    </Link>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: getEstadoColor(t.estado) }}>
                      {t.estado}
                    </span>
                  </td>
                  <td style={styles.td}>{t.prioridad}</td>
                  <td style={styles.td}>{t.asignado_a?.nombre || 'Sin asignar'}</td>
                  <td style={styles.td}>
                    <Link to={`/tickets/${t.id}`} style={{ marginRight: '10px', color: '#007bff' }}>Ver</Link>
                    <Link to={`/tickets/editar/${t.id}`} style={{ marginRight: '10px', color: '#28a745' }}>Editar</Link>
                    {user?.rol === 'admin' && (
                      <button onClick={() => handleDelete(t.id)} style={styles.buttonDanger}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// --- TicketForm ---
const TicketForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    asignado_a: ''
  });
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.rol === 'admin' || user?.rol === 'tecnico') {
          const resUsuarios = await axios.get(`${process.env.REACT_APP_API_URL}/usuarios`);
          setUsuarios(resUsuarios.data);
        }

        if (isEdit) {
          const resTicket = await axios.get(`${process.env.REACT_APP_API_URL}/tickets/${id}`);
          const t = resTicket.data;
          setFormData({
            titulo: t.titulo,
            descripcion: t.descripcion || '',
            prioridad: t.prioridad,
            asignado_a: t.asignado_a?.id || ''
          });
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar los datos', 'error');
        if (isEdit) navigate('/tickets');
      } finally {
        setCargandoDatos(false);
      }
    };
    fetchData();
  }, [id, user, isEdit, navigate, showToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${process.env.REACT_APP_API_URL}/tickets/${id}`, formData);
        showToast('Ticket actualizado correctamente', 'success');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/tickets`, formData);
        showToast('Ticket creado correctamente', 'success');
      }
      navigate('/tickets');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al guardar el ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cargandoDatos) return <div style={styles.loading}>Cargando datos...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card} className="fade-in">
        <h2>{isEdit ? 'Editar Ticket' : 'Nuevo Ticket'}</h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Título</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <label style={styles.label}>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="4"
            style={{ ...styles.input, resize: 'vertical' }}
          />

          <label style={styles.label}>Prioridad</label>
          <select
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>

          {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
            <>
              <label style={styles.label}>Asignar a</label>
              <select
                name="asignado_a"
                value={formData.asignado_a}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Sin asignar</option>
                {usuarios
                  .filter(u => u.rol === 'tecnico' || u.rol === 'admin')
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                  ))}
              </select>
            </>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <Link to="/tickets" style={{ marginLeft: '10px', color: '#6c757d' }}>Cancelar</Link>
        </form>
      </div>
    </div>
  );
};

// --- TicketDetail ---
const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cargarTicket = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tickets/${id}`);
      setTicket(res.data);
      setComentarios(res.data.comentarios || []);
    } catch (error) {
      console.error('Error al cargar ticket:', error);
      const msg = error.response?.data?.message || 'Error al cargar el ticket';
      showToast(msg, 'error');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    cargarTicket();
  }, [cargarTicket]);

  const agregarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) {
      showToast('El comentario no puede estar vacío', 'error');
      return;
    }
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/tickets/${id}/comentarios`, {
        contenido: nuevoComentario
      });
      const nuevo = res.data[0];
      setComentarios([...comentarios, { ...nuevo, usuario: user }]);
      setNuevoComentario('');
      showToast('Comentario agregado', 'success');
    } catch (error) {
      showToast('Error al agregar comentario', 'error');
    }
  };

  if (loading) return <div style={styles.loading}>Cargando ticket...</div>;
  if (!ticket) return <div style={styles.container}>Ticket no encontrado</div>;

  const getEstadoColor = (estado) => {
    const colores = {
      'abierto': '#28a745',
      'en progreso': '#ffc107',
      'cerrado': '#6c757d'
    };
    return colores[estado] || '#6c757d';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="fade-in">
        <h2>{ticket.titulo}</h2>
        <p><strong>Descripción:</strong> {ticket.descripcion || 'Sin descripción'}</p>
        <p><strong>Estado:</strong> <span style={{ ...styles.badge, backgroundColor: getEstadoColor(ticket.estado) }}>{ticket.estado}</span></p>
        <p><strong>Prioridad:</strong> {ticket.prioridad}</p>
        <p><strong>Creado por:</strong> {ticket.creado_por?.nombre} {ticket.creado_por?.apellido}</p>
        <p><strong>Asignado a:</strong> {ticket.asignado_a?.nombre || 'Sin asignar'}</p>
        <p><strong>Fecha creación:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
        <p><strong>Última actualización:</strong> {new Date(ticket.updated_at).toLocaleString()}</p>

        <Link to={`/tickets/editar/${ticket.id}`} style={{ marginRight: '10px' }}>
          <button style={styles.button}>Editar</button>
        </Link>
        <Link to="/tickets">
          <button style={{ ...styles.button, backgroundColor: '#6c757d' }}>Volver</button>
        </Link>
      </div>

      <div style={styles.card} className="fade-in">
        <h3>Comentarios</h3>
        {comentarios.length === 0 ? (
          <p>No hay comentarios aún.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {comentarios.map(c => (
              <li key={c.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }} className="fade-in">
                <strong>{c.usuario?.nombre} {c.usuario?.apellido}</strong>
                <span style={{ color: '#6c757d', fontSize: '0.8rem', marginLeft: '10px' }}>
                  {new Date(c.created_at).toLocaleString()}
                </span>
                <p style={{ margin: '5px 0 0' }}>{c.contenido}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={agregarComentario} style={{ marginTop: '15px' }}>
          <textarea
            placeholder="Escribe un comentario..."
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            rows="3"
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Agregar comentario</button>
        </form>
      </div>
    </div>
  );
};

// --- UsuariosList ---
const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user?.rol === 'admin') {
      axios.get(`${process.env.REACT_APP_API_URL}/usuarios`)
        .then(res => setUsuarios(res.data))
        .catch(() => showToast('Error al cargar usuarios', 'error'))
        .finally(() => setLoading(false));
    }
  }, [user, showToast]);

  if (loading) return <div style={styles.loading}>Cargando usuarios...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card} className="fade-in">
        <h2>Administración de Usuarios</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Apellido</th>
              <th style={styles.th}>Correo</th>
              <th style={styles.th}>Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="fade-in">
                <td style={styles.td}>{u.id}</td>
                <td style={styles.td}>{u.nombre}</td>
                <td style={styles.td}>{u.apellido}</td>
                <td style={styles.td}>{u.correo}</td>
                <td style={styles.td}>{u.rol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================
// 5. APP PRINCIPAL
// ============================
function App() {
  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={styles.loading}>Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={styles.loading}>Cargando...</div>;
    if (!user || user.rol !== 'admin') return <Navigate to="/tickets" />;
    return children;
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <style>{globalStyles}</style>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/tickets" element={<ProtectedRoute><TicketsList /></ProtectedRoute>} />
            <Route path="/tickets/nuevo" element={<ProtectedRoute><TicketForm /></ProtectedRoute>} />
            <Route path="/tickets/editar/:id" element={<ProtectedRoute><TicketForm /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
            <Route path="/usuarios" element={<AdminRoute><UsuariosList /></AdminRoute>} />
            <Route path="/" element={<Navigate to="/tickets" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
