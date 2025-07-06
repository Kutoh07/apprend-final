// Liste des CSP (Catégories Socio-Professionnelles)
export const CSP_OPTIONS = [
  { value: '', label: 'Sélectionner votre profession' },
  
  // 1. Agriculteurs exploitants
  { value: '11', label: 'Agriculteurs sur petite exploitation' },
  { value: '12', label: 'Agriculteurs sur moyenne exploitation' },
  { value: '13', label: 'Agriculteurs sur grande exploitation' },
  
  // 2. Artisans, commerçants et chefs d'entreprise
  { value: '21', label: 'Artisans' },
  { value: '22', label: 'Commerçants et assimilés' },
  { value: '23', label: 'Chefs d\'entreprise de 10 salariés ou plus' },
  
  // 3. Cadres et professions intellectuelles supérieures
  { value: '31', label: 'Professions libérales et assimilées' },
  { value: '32', label: 'Cadres de la fonction publique' },
  { value: '33', label: 'Professeurs, professions scientifiques' },
  { value: '34', label: 'Cadres administratifs et commerciaux d\'entreprise' },
  { value: '35', label: 'Ingénieurs et cadres techniques d\'entreprise' },
  { value: '36', label: 'Cadres de professions intermédiaires de la santé et du travail social' },
  { value: '37', label: 'Cadres artistiques et technico-artistiques' },
  { value: '38', label: 'Cadres des services administratifs, comptables et financiers' },
  
  // 4. Professions intermédiaires
  { value: '41', label: 'Professions intermédiaires de la santé et du travail social' },
  { value: '42', label: 'Cadres intermédiaires de l\'enseignement, de la culture, des fonctions administratives' },
  { value: '43', label: 'Techniciens' },
  { value: '44', label: 'Contremaîtres, agents de maîtrise' },
  { value: '45', label: 'Professions intermédiaires administratives et commerciales des entreprises' },
  { value: '46', label: 'Autres professions intermédiaires' },
  
  // 5. Employés
  { value: '51', label: 'Employés civils et agents de service de la fonction publique' },
  { value: '52', label: 'Employés administratifs d\'entreprise' },
  { value: '53', label: 'Employés de commerce' },
  { value: '54', label: 'Personnels des services directs aux particuliers' },
  
  // 6. Ouvriers
  { value: '61', label: 'Ouvriers qualifiés de type industriel' },
  { value: '62', label: 'Ouvriers non qualifiés de type industriel' },
  { value: '63', label: 'Ouvriers qualifiés de type artisanal' },
  { value: '64', label: 'Ouvriers non qualifiés de type artisanal' },
  { value: '65', label: 'Chauffeurs' },
  { value: '66', label: 'Ouvriers agricoles' },
  
  // 7. Retraités
  { value: '71', label: 'Anciens agriculteurs exploitants' },
  { value: '72', label: 'Anciens artisans, commerçants, chefs d\'entreprise' },
  { value: '73', label: 'Anciens cadres' },
  { value: '74', label: 'Anciennes professions intermédiaires' },
  { value: '75', label: 'Anciens employés' },
  { value: '76', label: 'Anciens ouvriers' },
  
  // 8. Autres personnes sans activité professionnelle
  { value: '81', label: 'Chômeurs n\'ayant jamais travaillé' },
  { value: '82', label: 'Élèves, étudiants, stagiaires non rémunérés' },
  { value: '83', label: 'Personnes au foyer' },
  { value: '84', label: 'Autres inactifs (invalides, préretraités, etc.)' }
];

// Options de genre
export const GENDER_OPTIONS = [
  { value: '', label: 'Sélectionner votre genre' },
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'non_binaire', label: 'Ne se prononce pas' }
];

// Liste des pays avec drapeaux (sélection des principaux)
export const COUNTRY_OPTIONS = [
  { value: '', label: 'Sélectionner votre pays', flag: '' },
  { value: 'FR', label: 'France', flag: '🇫🇷' },
  { value: 'BE', label: 'Belgique', flag: '🇧🇪' },
  { value: 'CH', label: 'Suisse', flag: '🇨🇭' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
  { value: 'MA', label: 'Maroc', flag: '🇲🇦' },
  { value: 'DZ', label: 'Algérie', flag: '🇩🇿' },
  { value: 'TN', label: 'Tunisie', flag: '🇹🇳' },
  { value: 'SN', label: 'Sénégal', flag: '🇸🇳' },
  { value: 'CI', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { value: 'LU', label: 'Luxembourg', flag: '🇱🇺' },
  { value: 'MC', label: 'Monaco', flag: '🇲🇨' },
  { value: 'AD', label: 'Andorre', flag: '🇦🇩' },
  { value: 'US', label: 'États-Unis', flag: '🇺🇸' },
  { value: 'GB', label: 'Royaume-Uni', flag: '🇬🇧' },
  { value: 'DE', label: 'Allemagne', flag: '🇩🇪' },
  { value: 'ES', label: 'Espagne', flag: '🇪🇸' },
  { value: 'IT', label: 'Italie', flag: '🇮🇹' },
  { value: 'PT', label: 'Portugal', flag: '🇵🇹' },
  { value: 'NL', label: 'Pays-Bas', flag: '🇳🇱' },
  { value: 'SE', label: 'Suède', flag: '🇸🇪' },
  { value: 'NO', label: 'Norvège', flag: '🇳🇴' },
  { value: 'DK', label: 'Danemark', flag: '🇩🇰' },
  { value: 'FI', label: 'Finlande', flag: '🇫🇮' },
  { value: 'AU', label: 'Australie', flag: '🇦🇺' },
  { value: 'NZ', label: 'Nouvelle-Zélande', flag: '🇳🇿' },
  { value: 'JP', label: 'Japon', flag: '🇯🇵' },
  { value: 'KR', label: 'Corée du Sud', flag: '🇰🇷' },
  { value: 'CN', label: 'Chine', flag: '🇨🇳' },
  { value: 'IN', label: 'Inde', flag: '🇮🇳' },
  { value: 'BR', label: 'Brésil', flag: '🇧🇷' },
  { value: 'AR', label: 'Argentine', flag: '🇦🇷' },
  { value: 'MX', label: 'Mexique', flag: '🇲🇽' },
  { value: 'ZA', label: 'Afrique du Sud', flag: '🇿🇦' }
];

// Générer les années de naissance (1910 à année actuelle)
export const generateBirthYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  years.push({ value: '', label: 'Sélectionner votre année de naissance' });
  
  for (let year = currentYear; year >= 1910; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  
  return years;
};