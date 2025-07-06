// Simulation d'un système d'authentification simple
class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Connexion
  async login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulation d'une validation
        if (email && password.length >= 6) {
          const user = {
            id: Date.now(),
            email: email,
            name: email.split('@')[0],
            progress: {
              level: 100,
              skills: {
                confiance: 85,
                discipline: 70,
                action: 95
              }
            }
          };
          
          this.currentUser = user;
          localStorage.setItem('user', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Email ou mot de passe invalide'));
        }
      }, 1000); // Simulation d'un délai réseau
    });
  }

  // Inscription
  async register(email, password, confirmPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (password !== confirmPassword) {
          reject(new Error('Les mots de passe ne correspondent pas'));
          return;
        }
        
        if (email && password.length >= 6) {
          const user = {
            id: Date.now(),
            email: email,
            name: email.split('@')[0],
            progress: {
              level: 25, // Nouvel utilisateur commence à 25%
              skills: {
                confiance: 20,
                discipline: 10,
                action: 30
              }
            }
          };
          
          this.currentUser = user;
          localStorage.setItem('user', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Données invalides'));
        }
      }, 1000);
    });
  }

  // Déconnexion
  logout() {
    this.currentUser = null;
    localStorage.removeItem('user');
  }

  // Vérifier si connecté
  isAuthenticated() {
    return this.currentUser !== null || localStorage.getItem('user') !== null;
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    const stored = localStorage.getItem('user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    
    return null;
  }
}

export const authService = new AuthService();