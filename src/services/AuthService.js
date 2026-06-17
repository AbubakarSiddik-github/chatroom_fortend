import api from '../api/axiosConfig';

const AuthService = {
  /**
   * Register a new user.
   * @param {string} username
   * @param {string} email
   * @param {string} password
   */
  register: async (username, email, password) => {
    const response = await api.post('/api/auth/register', { username, email, password });
    return response.data; // { token: null, message: "User registered successfully" }
  },

  /**
   * Login with email or username + password.
   * Saves JWT to localStorage on success.
   * @param {string} identifier  — email or username
   * @param {string} password
   */
  login: async (identifier, password) => {
    const response = await api.post('/api/auth/login', { identifier, password });
    const { token, message } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      // Decode user info from JWT payload (base64)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('user', JSON.stringify({
          id: payload.sub,
          email: payload.email,
          username: payload.username,
        }));
      } catch (_) { /* ignore decode errors */ }
    }

    return response.data;
  },

  /** Remove token and user from storage. */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /** Returns the stored user object or null. */
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (_) {
      return null;
    }
  },

  /** Returns true if a JWT token exists in localStorage. */
  isLoggedIn: () => !!localStorage.getItem('token'),
};

export default AuthService;
