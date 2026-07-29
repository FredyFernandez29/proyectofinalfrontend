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
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <div style={styles.navBrand}>
          <span style={styles.brandIcon}>🎫</span>
          <span style={styles.brandText}>TicketSystem</span>
        </div>
        <div style={styles.navLinks}>
          <Link to="/tickets" style={styles.navLink}>Tickets</Link>
          {user?.rol === 'admin' && <Link to="/usuarios" style={styles.navLink}>Usuarios</Link>}
          <span style={styles.userBadge}>{user?.nombre} ({user?.rol})</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </div>
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
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(correo, password);
    setLoading(false);
    if (result.success) {
      navigate('/tickets');
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h2 style={styles.loginTitle}>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <p style={styles.errorMsg}>{error}</p>}
          <button type="submit" style={styles.loginBtn} disabled={loading}>
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 4. COMPONENTE: LISTA DE TICKETS
// ============================================================
const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tickets`);
      setTickets(res.data);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este ticket permanentemente?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/tickets/${id}`);
        setTickets(tickets.filter(t => t.id !== id));
      } catch (error) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'abierto': '#ffc107',
      'en progreso': '#17a2b8',
      'cerrado': '#28a745'
    };
    return colors[estado] || '#6c757d';
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      'baja': '#28a745',
      'media': '#ffc107',
      'alta': '#dc3545'
    };
    return colors[prioridad] || '#6c757d';
  };

  if (loading) return <div style={styles.loading}>Cargando tickets...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>Mis Tickets</h2>
        <Link to="/tickets/nuevo">
          <button style={styles.btnPrimary}>+ Nuevo Ticket</button>
        </Link>
      </div>
      {tickets.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No hay tickets disponibles.</p>
          <p style={styles.emptySub}>Crea un nuevo ticket para comenzar.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
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
              {tickets.map(t => (
                <tr key={t.id}>
                  <td style={styles.td}>#{t.id}</td>
                  <td style={styles.td}>{t.titulo}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: getEstadoColor(t.estado) }}>
                      {t.estado}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: getPrioridadColor(t.prioridad) }}>
                      {t.prioridad}
                    </span>
                  </td>
                  <td style={styles.td}>{t.asignado_a?.nombre || 'Sin asignar'}</td>
                  <td style={styles.td}>
                    <Link to={`/tickets/editar/${t.id}`} style={styles.actionLink}>Editar</Link>
                    <Link to={`/tickets/${t.id}`} style={{...styles.actionLink, marginLeft: '10px'}}>Ver</Link>
                    {user?.rol === 'admin' && (
                      <button onClick={() => handleDelete(t.id)} style={styles.deleteBtn}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 5. COMPONENTE: DETALLE DEL TICKET (con comentarios)
// ============================================================
const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cargarTicketYComentarios();
  }, [id]);

  const cargarTicketYComentarios = async () => {
    setLoading(true);
    try {
      const ticketsRes = await axios.get(`${process.env.REACT_APP_API_URL}/tickets`);
      const ticketEncontrado = ticketsRes.data.find(t => t.id === parseInt(id));
      if (!ticketEncontrado) {
        alert('Ticket no encontrado');
        navigate('/tickets');
        return;
      }
      setTicket(ticketEncontrado);

      const comentariosRes = await axios.get(`${process.env.REACT_APP_API_URL}/tickets/${id}/comentarios`);
      setComentarios(comentariosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComentarioSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setEnviando(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/tickets/${id}/comentarios`, {
        contenido: nuevoComentario
      });
      setNuevoComentario('');
      // Recargar comentarios
      const comentariosRes = await axios.get(`${process.env.REACT_APP_API_URL}/tickets/${id}/comentarios`);
      setComentarios(comentariosRes.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al enviar comentario');
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminarComentario = async (comentarioId) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/comentarios/${comentarioId}`);
      setComentarios(comentarios.filter(c => c.id !== comentarioId));
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar comentario');
    }
  };

  if (loading) return <div style={styles.loading}>Cargando ticket...</div>;
  if (!ticket) return <div style={styles.loading}>Ticket no encontrado</div>;

  return (
    <div style={styles.container}>
      <div style={styles.detailHeader}>
        <h2 style={styles.pageTitle}>{ticket.titulo}</h2>
        <button onClick={() => navigate('/tickets')} style={styles.btnSecondary}>Volver</button>
      </div>
      <div style={styles.detailCard}>
        <p><strong>Descripción:</strong> {ticket.descripcion || 'Sin descripción'}</p>
        <p><strong>Estado:</strong> <span style={{...styles.badge, backgroundColor: '#ffc107'}}>{ticket.estado}</span></p>
        <p><strong>Prioridad:</strong> <span style={{...styles.badge, backgroundColor: '#ffc107'}}>{ticket.prioridad}</span></p>
        <p><strong>Creado por:</strong> {ticket.creado_por?.nombre || 'Desconocido'}</p>
        <p><strong>Asignado a:</strong> {ticket.asignado_a?.nombre || 'Sin asignar'}</p>
        <p><strong>Fecha creación:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
      </div>

      <h3 style={styles.commentTitle}>Comentarios</h3>
      <div style={styles.commentList}>
        {comentarios.length === 0 ? (
          <p style={styles.emptySub}>No hay comentarios aún.</p>
        ) : (
          comentarios.map(c => (
            <div key={c.id} style={styles.commentItem}>
              <div style={styles.commentHeader}>
                <strong>{c.usuario_id?.nombre || 'Usuario'}</strong>
                <span style={styles.commentDate}>{new Date(c.created_at).toLocaleString()}</span>
                {(user?.rol === 'admin' || user?.id === c.usuario_id?.id) && (
                  <button onClick={() => handleEliminarComentario(c.id)} style={styles.deleteCommentBtn}>✕</button>
                )}
              </div>
              <p style={styles.commentBody}>{c.contenido}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleComentarioSubmit} style={styles.commentForm}>
        <textarea
          placeholder="Escribe un comentario..."
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          rows="3"
          style={styles.commentTextarea}
        />
        <button type="submit" style={styles.btnPrimary} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Comentar'}
        </button>
      </form>
    </div>
  );
};

// ============================================================
// 6. COMPONENTE: FORMULARIO DE TICKET (CREAR/EDITAR)
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
    estado: 'abierto',
    asignado_a: ''
  });
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar usuarios si es admin o tecnico
        if (user?.rol === 'admin' || user?.rol === 'tecnico') {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/usuarios`);
          setUsuarios(res.data);
        }

        // Si es edición, cargar ticket
        if (isEdit) {
          const ticketsRes = await axios.get(`${process.env.REACT_APP_API_URL}/tickets`);
          const ticket = ticketsRes.data.find(t => t.id === parseInt(id));
          if (ticket) {
            setFormData({
              titulo: ticket.titulo || '',
              descripcion: ticket.descripcion || '',
              prioridad: ticket.prioridad || 'media',
              estado: ticket.estado || 'abierto',
              asignado_a: ticket.asignado_a?.id || ''
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [id, user]);

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
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>{isEdit ? 'Editar Ticket' : 'Nuevo Ticket'}</h2>
        <button onClick={() => navigate('/tickets')} style={styles.btnSecondary}>Cancelar</button>
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Título *</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Resumen del problema"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="4"
            style={styles.textarea}
            placeholder="Detalla el problema a resolver"
          />
        </div>
        <div style={styles.row}>
          <div style={{...styles.inputGroup, flex: 1, marginRight: '10px'}}>
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
          </div>
          {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
            <div style={{...styles.inputGroup, flex: 1, marginLeft: '10px'}}>
              <label style={styles.label}>Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="abierto">Abierto</option>
                <option value="en progreso">En progreso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          )}
        </div>
        {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
          <div style={styles.inputGroup}>
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
          </div>
        )}
        <button type="submit" style={styles.btnPrimary} disabled={loading}>
          {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Ticket'}
        </button>
      </form>
    </div>
  );
};

// ============================================================
// 7. COMPONENTE: GESTIÓN DE USUARIOS (solo admin)
// ============================================================
const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    edad: '',
    clave: '',
    rol: 'cliente'
  });
  const { user } = useAuth();

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/usuarios`);
      setUsuarios(res.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/usuarios`, nuevoUsuario);
      setShowForm(false);
      setNuevoUsuario({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        edad: '',
        clave: '',
        rol: 'cliente'
      });
      cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleEliminarUsuario = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    if (id === user.id) {
      alert('No puedes eliminarte a ti mismo.');
      return;
    }
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/usuarios/${id}`);
      cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  if (loading) return <div style={styles.loading}>Cargando usuarios...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>Gestión de Usuarios</h2>
        <button onClick={() => setShowForm(!showForm)} style={styles.btnPrimary}>
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCrearUsuario} style={styles.form}>
          <h3 style={styles.subtitle}>Crear nuevo usuario</h3>
          <div style={styles.row}>
            <div style={{...styles.inputGroup, flex: 1, marginRight: '10px'}}>
              <label style={styles.label}>Nombre *</label>
              <input
                type="text"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                required
                style={styles.input}
              />
            </div>
            <div style={{...styles.inputGroup, flex: 1, marginLeft: '10px'}}>
              <label style={styles.label}>Apellido *</label>
              <input
                type="text"
                value={nuevoUsuario.apellido}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, apellido: e.target.value})}
                required
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo *</label>
            <input
              type="email"
              value={nuevoUsuario.correo}
              onChange={(e) => setNuevoUsuario({...nuevoUsuario, correo: e.target.value})}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.row}>
            <div style={{...styles.inputGroup, flex: 1, marginRight: '10px'}}>
              <label style={styles.label}>Teléfono</label>
              <input
                type="text"
                value={nuevoUsuario.telefono}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, telefono: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={{...styles.inputGroup, flex: 1, marginLeft: '10px'}}>
              <label style={styles.label}>Edad</label>
              <input
                type="number"
                value={nuevoUsuario.edad}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, edad: e.target.value})}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña *</label>
            <input
              type="password"
              value={nuevoUsuario.clave}
              onChange={(e) => setNuevoUsuario({...nuevoUsuario, clave: e.target.value})}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Rol</label>
            <select
              value={nuevoUsuario.rol}
              onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
              style={styles.input}
            >
              <option value="cliente">Cliente</option>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" style={styles.btnPrimary}>Crear Usuario</button>
        </form>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td style={styles.td}>{u.id}</td>
                <td style={styles.td}>{u.nombre} {u.apellido}</td>
                <td style={styles.td}>{u.correo}</td>
                <td style={styles.td}>{u.telefono || '-'}</td>
                <td style={styles.td}>
                  <span style={{...styles.badge, backgroundColor: u.rol === 'admin' ? '#dc3545' : u.rol === 'tecnico' ? '#17a2b8' : '#28a745'}}>
                    {u.rol}
                  </span>
                </td>
                <td style={styles.td}>
                  {u.id !== user.id && (
                    <button onClick={() => handleEliminarUsuario(u.id)} style={styles.deleteBtn}>Eliminar</button>
                  )}
                  {u.id === user.id && <span style={styles.youBadge}>Tú</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// 8. COMPONENTE PRINCIPAL APP (CON RUTAS)
// ============================================================
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
    if (!user) return <Navigate to="/login" />;
    if (user.rol !== 'admin') return <Navigate to="/tickets" />;
    return children;
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tickets" element={
            <ProtectedRoute><TicketsList /></ProtectedRoute>
          } />
          <Route path="/tickets/nuevo" element={
            <ProtectedRoute><TicketForm /></ProtectedRoute>
          } />
          <Route path="/tickets/editar/:id" element={
            <ProtectedRoute><TicketForm /></ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute><TicketDetail /></ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <AdminRoute><UsuariosList /></AdminRoute>
          } />
          <Route path="/" element={<Navigate to="/tickets" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// ============================================================
// 9. ESTILOS EN LÍNEA (para simplicidad)
// ============================================================
const styles = {
  // Navbar
  navbar: {
    background: '#2c3e50',
    padding: '0 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '10px 0',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandIcon: {
    fontSize: '24px',
  },
  brandText: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background 0.3s',
  },
  userBadge: {
    color: '#ecf0f1',
    background: '#34495e',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
  },
  logoutBtn: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },

  // Login
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    background: '#f5f6fa',
  },
  loginCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  loginTitle: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#2c3e50',
  },

  // General
  container: {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '0 20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  pageTitle: {
    color: '#2c3e50',
    fontSize: '24px',
  },
  subtitle: {
    color: '#2c3e50',
    fontSize: '18px',
    marginBottom: '15px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#7f8c8d',
    fontSize: '18px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
    fontSize: '18px',
  },
  emptySub: {
    color: '#95a5a6',
    fontSize: '14px',
  },

  // Formularios
  form: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '20px',
  },

  // Botones
  btnPrimary: {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.3s',
  },
  btnSecondary: {
    background: '#95a5a6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.3s',
  },
  deleteBtn: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '5px',
  },
  loginBtn: {
    width: '100%',
    padding: '12px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },

  // Tabla
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ecf0f1',
    textAlign: 'left',
  },

  // Badges
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  youBadge: {
    background: '#3498db',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },

  // Acciones
  actionLink: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '14px',
  },
  errorMsg: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: '10px',
  },

  // Detalle y comentarios
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  detailCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  commentTitle: {
    color: '#2c3e50',
    marginBottom: '15px',
  },
  commentList: {
    marginBottom: '20px',
  },
  commentItem: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  commentDate: {
    color: '#7f8c8d',
    fontSize: '12px',
  },
  commentBody: {
    margin: '5px 0 0 0',
    color: '#2c3e50',
  },
  commentForm: {
    marginTop: '20px',
  },
  commentTextarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
  deleteCommentBtn: {
    background: 'transparent',
    border: 'none',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default App;
