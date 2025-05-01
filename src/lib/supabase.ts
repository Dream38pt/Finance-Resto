import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies'
  );
}

// Amélioration de la configuration du client avec une meilleure gestion des erreurs
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x',
    },
  },
  // Ajout de la configuration réseau pour une meilleure gestion des erreurs
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Vérification de la connexion
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('Déconnecté de Supabase');
  } else if (event === 'SIGNED_IN') {
    console.log('Connecté à Supabase');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token Supabase rafraîchi');
  }
});

// Test de la connexion
(async () => {
  try {
    const { error } = await supabase.from('entite').select('count').single();
    if (error) {
      console.error('Erreur de connexion à Supabase:', error.message);
    } else {
      console.log('Connexion à Supabase établie avec succès');
    }
  } catch (err) {
    console.error('Erreur lors du test de connexion:', err);
  }
})();