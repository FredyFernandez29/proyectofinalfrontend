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
// 2. SISTEMA DE NOTIFICACIONES
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
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    animation: 'slideIn 0.3s ease-out',
    minWidth: '250px',
    maxWidth: '400px',
  },
  success: { backgroundColor: '#10b981' },
  error: { backgroundColor: '#ef4444' },
  info: { backgroundColor: '#3b82f6' },
};

const globalStyles = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  body {
    background: #f1f5f9;
    margin: 0;
    padding: 0;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }
`;

// ============================
// 3. ESTILOS GLOBALES
// ============================
const styles = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02)',
    padding: '24px',
    marginBottom: '24px',
    transition: 'box-shadow 0.25s ease, transform 0.2s ease',
    border: '1px solid rgba(0, 0, 0, 0.02)',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#fafcff',
  },
  label: {
    fontWeight: '600',
    display: 'block',
    marginBottom: '6px',
    color: '#1e293b',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
  },
  th: {
    background: '#f8fafc',
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: '2px solid #e2e8f0',
    color: '#1e293b',
    fontWeight: '600',
    fontSize: '13px',
    letterSpacing: '0.02em',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
  },
  nav: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #0b2b44 0%, #1a4b6d 100%)',
    borderRadius: '16px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(11, 43, 68, 0.25)',
    color: '#ffffff',
  },
  link: {
    textDecoration: 'none',
    color: '#93c5fd',
    fontWeight: '500',
    transition: 'color 0.2s',
    padding: '4px 0',
    borderBottom: '2px solid transparent',
  },
  badge: {
    padding: '4px 14px',
    borderRadius: '30px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    display: 'inline-block',
    letterSpacing: '0.01em',
  },
  loading: {
    textAlign: 'center',
    padding: '80px',
    fontSize: '18px',
    color: '#4a6a85',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#0b2b44',
    lineHeight: '1.2',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    marginTop: '4px',
  },
  priorityDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '6px',
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
      <span style={{ fontWeight: '700', fontSize: '20px', letterSpacing: '-0.01em' }}>Ticket System</span>
      <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>Rol: <strong style={{ color: '#93c5fd' }}>{user?.rol || 'invitado'}</strong></span>
      <Link to="/tickets" style={styles.link}>Dashboard</Link>
      {user?.rol === 'admin' && <Link to="/usuarios" style={styles.link}>Usuarios</Link>}
      <button onClick={handleLogout} style={{ ...styles.button, backgroundColor: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>Cerrar Sesión</button>
    </div>
  );
};

// --- Login (sin "olvidaste contraseña") ---
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
    <div style={{ ...styles.container, maxWidth: '420px', marginTop: '80px' }}>
      <div style={styles.card} className="fade-in">
        <h2 style={{ color: '#0b2b44', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Iniciar Sesión</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Ingresa tus credenciales para continuar</p>
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
          {error && <p style={{ color: '#ef4444', marginTop: '16px' }}>{error}</p>}
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

  const total = tickets.length;
  const abiertos = tickets.filter(t => t.estado === 'abierto').length;
  const enProgreso = tickets.filter(t => t.estado === 'en progreso').length;
  const cerrados = tickets.filter(t => t.estado === 'cerrado').length;
  const alta = tickets.filter(t => t.prioridad === 'alta').length;
  const media = tickets.filter(t => t.prioridad === 'media').length;
  const baja = tickets.filter(t => t.prioridad === 'baja').length;

  const getEstadoColor = (estado) => {
    const colores = { 'abierto': '#10b981', 'en progreso': '#f59e0b', 'cerrado': '#94a3b8' };
    return colores[estado] || '#94a3b8';
  };

  const getPrioridadColor = (prioridad) => {
    const colores = { 'alta': '#ef4444', 'media': '#f59e0b', 'baja': '#10b981' };
    return colores[prioridad] || '#94a3b8';
  };

  if (loading) return <div style={styles.loading}>Cargando tickets...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.statGrid}>
        <div style={styles.statCard} className="fade-in">
          <div style={styles.statNumber}>{total}</div>
          <div style={styles.statLabel}>Total Tickets</div>
        </div>
        <div style={styles.statCard} className="fade-in">
          <div style={{ ...styles.statNumber, color: '#10b981' }}>{abiertos}</div>
          <div style={styles.statLabel}>Abiertos</div>
        </div>
        <div style={styles.statCard} className="fade-in">
          <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{enProgreso}</div>
          <div style={styles.statLabel}>En Progreso</div>
        </div>
        <div style={styles.statCard} className="fade-in">
          <div style={{ ...styles.statNumber, color: '#94a3b8' }}>{cerrados}</div>
          <div style={styles.statLabel}>Cerrados</div>
        </div>
        <div style={styles.statCard} className="fade-in">
          <div style={{ ...styles.statNumber, color: '#ef4444' }}>{alta}</div>
          <div style={styles.statLabel}>Prioridad Alta</div>
        </div>
        <div style={styles.statCard} className="fade-in">
          <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{media}</div>
          <div style={styles.statLabel}>Prioridad Media</div>
        </div>
        <div style={styles.statCard} className="fade-in">
          <div style={{ ...styles.statNumber, color: '#10b981' }}>{baja}</div>
          <div style={styles.statLabel}>Prioridad Baja</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#0b2b44', fontSize: '22px', fontWeight: '700' }}>Mis Tickets</h2>
        <Link to="/tickets/nuevo">
          <button style={styles.button}>+ Crear Nuevo Ticket</button>
        </Link>
      </div>

      <div style={styles.card} className="fade-in">
        {tickets.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No tienes tickets. ¡Crea uno nuevo!</p>
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
                <tr key={t.id} className="fade-in" style={{ transition: 'background 0.15s' }}>
                  <td style={styles.td}>{t.id}</td>
                  <td style={styles.td}>
                    <Link to={`/tickets/${t.id}`} style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}>
                      {t.titulo}
                    </Link>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: getEstadoColor(t.estado) }}>
                      {t.estado}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ ...styles.priorityDot, backgroundColor: getPrioridadColor(t.prioridad) }}></span>
                      {t.prioridad}
                    </span>
                  </td>
                  <td style={styles.td}>{t.asignado_a?.nombre || 'Sin asignar'}</td>
                  <td style={styles.td}>
                    <Link to={`/tickets/${t.id}`} style={{ marginRight: '12px', color: '#2563eb', fontWeight: '500' }}>Ver</Link>
                    <Link to={`/tickets/editar/${t.id}`} style={{ marginRight: '12px', color: '#10b981', fontWeight: '500' }}>Editar</Link>
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
// --- TicketForm (actualizado con campo de estado) ---
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
    estado: 'abierto',  // <--- NUEVO CAMPO
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
            estado: t.estado || 'abierto',  // <--- CARGAR ESTADO
            asignado_a: t.asignado_a?.id || ''
          });
        }
      } catch (error) {
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
        <h2 style={{ color: '#0b2b44', fontSize: '24px', fontWeight: '700' }}>{isEdit ? 'Editar Ticket' : 'Nuevo Ticket'}</h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Título</label>
          <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required style={styles.input} />

          <label style={styles.label}>Descripción</label>
          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" style={{ ...styles.input, resize: 'vertical' }} />

          <label style={styles.label}>Prioridad</label>
          <select name="prioridad" value={formData.prioridad} onChange={handleChange} style={styles.input}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>

          {/* CAMPO DE ESTADO - solo visible en edición */}
          {isEdit && (
            <>
              <label style={styles.label}>Estado</label>
              <select name="estado" value={formData.estado} onChange={handleChange} style={styles.input}>
                <option value="abierto">Abierto</option>
                <option value="en progreso">En progreso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </>
          )}

          {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
            <>
              <label style={styles.label}>Asignar a</label>
              <select name="asignado_a" value={formData.asignado_a} onChange={handleChange} style={styles.input}>
                <option value="">Sin asignar</option>
                {usuarios.filter(u => u.rol === 'tecnico' || u.rol === 'admin').map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
            </>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <Link to="/tickets" style={{ marginLeft: '12px', color: '#64748b' }}>Cancelar</Link>
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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tickets/${id}`);
      setTicket(res.data);
      setComentarios(res.data.comentarios || []);
    } catch (error) {
      showToast('Error al cargar el ticket', 'error');
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
      setComentarios([...comentarios, { ...nuevo, usuarios: user }]);
      setNuevoComentario('');
      showToast('Comentario agregado', 'success');
    } catch (error) {
      showToast('Error al agregar comentario', 'error');
    }
  };

  if (loading) return <div style={styles.loading}>Cargando ticket...</div>;
  if (!ticket) return <div style={styles.container}>Ticket no encontrado</div>;

  const getEstadoColor = (estado) => {
    const colores = { 'abierto': '#10b981', 'en progreso': '#f59e0b', 'cerrado': '#94a3b8' };
    return colores[estado] || '#94a3b8';
  };

  const getPrioridadColor = (prioridad) => {
    const colores = { 'alta': '#ef4444', 'media': '#f59e0b', 'baja': '#10b981' };
    return colores[prioridad] || '#94a3b8';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="fade-in">
        <h2 style={{ color: '#0b2b44', fontSize: '24px', fontWeight: '700' }}>{ticket.titulo}</h2>
        <p><strong>Descripción:</strong> {ticket.descripcion || 'Sin descripción'}</p>
        <p><strong>Estado:</strong> <span style={{ ...styles.badge, backgroundColor: getEstadoColor(ticket.estado) }}>{ticket.estado}</span></p>
        <p><strong>Prioridad:</strong> <span style={{ display: 'inline-flex', alignItems: 'center' }}><span style={{ ...styles.priorityDot, backgroundColor: getPrioridadColor(ticket.prioridad) }}></span> {ticket.prioridad}</span></p>
        <p><strong>Creado por:</strong> {ticket.creado_por?.nombre} {ticket.creado_por?.apellido}</p>
        <p><strong>Asignado a:</strong> {ticket.asignado_a?.nombre || 'Sin asignar'}</p>
        <p><strong>Fecha creación:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
        <p><strong>Última actualización:</strong> {new Date(ticket.updated_at).toLocaleString()}</p>
        <Link to={`/tickets/editar/${ticket.id}`} style={{ marginRight: '12px' }}>
          <button style={styles.button}>Editar</button>
        </Link>
        <Link to="/tickets">
          <button style={{ ...styles.button, backgroundColor: '#94a3b8', boxShadow: 'none' }}>Volver</button>
        </Link>
      </div>
      <div style={styles.card} className="fade-in">
        <h3 style={{ color: '#0b2b44', fontSize: '18px', fontWeight: '600' }}>Comentarios</h3>
        {comentarios.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay comentarios aún.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {comentarios.map(c => (
              <li key={c.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }} className="fade-in">
                <strong style={{ color: '#0b2b44' }}>{c.usuarios?.nombre} {c.usuarios?.apellido}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '12px' }}>
                  {new Date(c.created_at).toLocaleString()}
                </span>
                <p style={{ margin: '6px 0 0', color: '#1e293b' }}>{c.contenido}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={agregarComentario} style={{ marginTop: '16px' }}>
          <textarea placeholder="Escribe un comentario..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} rows="3" style={styles.input} />
          <button type="submit" style={styles.button}>Agregar comentario</button>
        </form>
      </div>
    </div>
  );
};

// ============================
// 5. COMPONENTES DE USUARIOS
// ============================

// --- UserForm ---
const UserForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    clave: '',
    telefono: '',
    edad: '',
    rol: 'cliente'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/usuarios`, formData);
      showToast('Usuario creado correctamente', 'success');
      navigate('/usuarios');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al crear usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="fade-in">
        <h2 style={{ color: '#0b2b44', fontSize: '24px', fontWeight: '700' }}>Crear Nuevo Usuario</h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Nombre</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={styles.input} />
          <label style={styles.label}>Apellido</label>
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required style={styles.input} />
          <label style={styles.label}>Correo</label>
          <input type="email" name="correo" value={formData.correo} onChange={handleChange} required style={styles.input} />
          <label style={styles.label}>Contraseña</label>
          <input type="password" name="clave" value={formData.clave} onChange={handleChange} required style={styles.input} />
          <label style={styles.label}>Teléfono</label>
          <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} style={styles.input} />
          <label style={styles.label}>Edad</label>
          <input type="number" name="edad" value={formData.edad} onChange={handleChange} style={styles.input} />
          <label style={styles.label}>Rol</label>
          <select name="rol" value={formData.rol} onChange={handleChange} style={styles.input}>
            <option value="cliente">Cliente</option>
            <option value="tecnico">Técnico</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Creando...' : 'Crear Usuario'}</button>
          <Link to="/usuarios" style={{ marginLeft: '12px', color: '#64748b' }}>Cancelar</Link>
        </form>
      </div>
    </div>
  );
};

// --- UsuariosList ---
const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/usuarios`)
      .then(res => setUsuarios(res.data))
      .catch(() => showToast('Error al cargar usuarios', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading) return <div style={styles.loading}>Cargando usuarios...</div>;

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#0b2b44', fontSize: '22px', fontWeight: '700' }}>Administración de Usuarios</h2>
        <Link to="/usuarios/nuevo">
          <button style={styles.button}>+ Crear Usuario</button>
        </Link>
      </div>
      <div style={styles.card} className="fade-in">
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
// 6. APP PRINCIPAL
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
            <Route path="/usuarios/nuevo" element={<AdminRoute><UserForm /></AdminRoute>} />
            <Route path="/" element={<Navigate to="/tickets" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
