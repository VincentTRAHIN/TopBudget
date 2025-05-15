// Fonction pour générer une couleur d'arrière-plan pour l'avatar basée sur le nom de l'utilisateur
const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-red-600',
  'bg-green-600',
  'bg-yellow-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-orange-600',
  'bg-cyan-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-fuchsia-600',
];

export const getAvatarColor = (name: string = ''): string => {
  if (!name) return AVATAR_COLORS[0];
  
  // Utiliser la somme des codes de caractère pour déterminer une couleur constante pour un nom donné
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = sum % AVATAR_COLORS.length;
  
  return AVATAR_COLORS[index];
};

export const getInitials = (name: string = ''): string => {
  if (!name) return '?';
  
  // Diviser le nom en parties (prénom et nom)
  const parts = name.trim().split(/\s+/);
  
  // Si une seule partie, retourner la première lettre
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Sinon, retourner les initiales du prénom et du nom
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
