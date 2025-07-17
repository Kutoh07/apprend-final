// Comparaison de chaînes
// src/lib/utils/stringComparison.ts

export interface TextDifference {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  text: string;
  position: number;
  expectedText?: string; // Pour les mots incorrects
}

export interface ComparisonResult {
  isMatch: boolean;
  accuracy: number; // 0-100%
  differences: TextDifference[];
  normalizedInput: string;
  normalizedTarget: string;
  levenshteinDistance: number;
  wordAccuracy: number; // Précision au niveau des mots
  characterAccuracy: number; // Précision au niveau des caractères
}

export interface ComparisonOptions {
  caseSensitive?: boolean;
  ignorePunctuation?: boolean;
  ignoreAccents?: boolean;
  ignoreExtraSpaces?: boolean;
  strictWordOrder?: boolean;
  minimumAccuracy?: number; // Seuil pour considérer comme correct (0-100)
  allowTypos?: boolean; // Tolérance pour les fautes de frappe mineures
  maxTypoDistance?: number; // Distance Levenshtein maximale pour un mot
}

/**
 * Options par défaut pour la comparaison de phrases Renaissance
 */
export const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  caseSensitive: false,
  ignorePunctuation: true,
  ignoreAccents: true,
  ignoreExtraSpaces: true,
  strictWordOrder: true,
  minimumAccuracy: 95,
  allowTypos: true,
  maxTypoDistance: 2
};

/**
 * Normalise une chaîne de caractères selon les options données
 */
export function normalizeText(text: string, options: ComparisonOptions = DEFAULT_COMPARISON_OPTIONS): string {
  let normalized = text;

  // Trim et gérer les espaces
  normalized = normalized.trim();
  
  if (options.ignoreExtraSpaces) {
    normalized = normalized.replace(/\s+/g, ' ');
  }

  // Casse
  if (!options.caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  // Accents
  if (options.ignoreAccents) {
    normalized = removeAccents(normalized);
  }

  // Ponctuation
  if (options.ignorePunctuation) {
    normalized = normalized.replace(/[.,;:!?¿¡"'«»""''`´]/g, '');
    normalized = normalized.replace(/[^\w\s]/g, '');
  }

  // Nettoyer les espaces multiples après suppression de ponctuation
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Supprime les accents d'une chaîne
 */
export function removeAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[àáâãäå]/gi, 'a')
    .replace(/[èéêë]/gi, 'e')
    .replace(/[ìíîï]/gi, 'i')
    .replace(/[òóôõö]/gi, 'o')
    .replace(/[ùúûü]/gi, 'u')
    .replace(/[ÿý]/gi, 'y')
    .replace(/[ñ]/gi, 'n')
    .replace(/[ç]/gi, 'c')
    .replace(/[œ]/gi, 'oe')
    .replace(/[æ]/gi, 'ae');
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Vérifie si deux mots sont similaires (gestion des fautes de frappe)
 */
export function areWordsSimilar(
  word1: string, 
  word2: string, 
  maxDistance: number = 2
): boolean {
  if (word1 === word2) return true;
  if (Math.abs(word1.length - word2.length) > maxDistance) return false;
  
  const distance = levenshteinDistance(word1, word2);
  return distance <= maxDistance;
}

/**
 * Compare deux textes et retourne un résultat détaillé
 */
export function compareTexts(
  input: string, 
  target: string, 
  options: ComparisonOptions = DEFAULT_COMPARISON_OPTIONS
): ComparisonResult {
  const normalizedInput = normalizeText(input, options);
  const normalizedTarget = normalizeText(target, options);

  // Comparaison exacte après normalisation
  const isExactMatch = normalizedInput === normalizedTarget;

  // Diviser en mots pour analyse détaillée
  const inputWords = normalizedInput.split(' ').filter(w => w.length > 0);
  const targetWords = normalizedTarget.split(' ').filter(w => w.length > 0);

  const differences: TextDifference[] = [];
  let correctWords = 0;
  let correctCharacters = 0;

  if (options.strictWordOrder) {
    // Comparaison mot par mot dans l'ordre
    const maxLength = Math.max(inputWords.length, targetWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      const inputWord = inputWords[i];
      const targetWord = targetWords[i];

      if (!inputWord && targetWord) {
        // Mot manquant
        differences.push({
          type: 'missing',
          text: targetWord,
          position: i,
          expectedText: targetWord
        });
      } else if (inputWord && !targetWord) {
        // Mot en trop
        differences.push({
          type: 'extra',
          text: inputWord,
          position: i
        });
      } else if (inputWord && targetWord) {
        if (inputWord === targetWord) {
          // Mot correct
          differences.push({
            type: 'correct',
            text: inputWord,
            position: i
          });
          correctWords++;
          correctCharacters += inputWord.length;
        } else if (options.allowTypos && areWordsSimilar(inputWord, targetWord, options.maxTypoDistance || 2)) {
          // Mot avec faute de frappe mineure - considéré comme correct
          differences.push({
            type: 'correct',
            text: inputWord,
            position: i,
            expectedText: targetWord
          });
          correctWords++;
          correctCharacters += Math.min(inputWord.length, targetWord.length);
        } else {
          // Mot incorrect
          differences.push({
            type: 'incorrect',
            text: inputWord,
            position: i,
            expectedText: targetWord
          });
          // Compter les caractères corrects dans le mot incorrect
          const commonChars = countCommonCharacters(inputWord, targetWord);
          correctCharacters += commonChars;
        }
      }
    }
  } else {
    // Comparaison flexible (ordre non strict)
    const usedTargetIndices = new Set<number>();
    
    for (let i = 0; i < inputWords.length; i++) {
      const inputWord = inputWords[i];
      let foundMatch = false;

      // Chercher une correspondance exacte
      for (let j = 0; j < targetWords.length; j++) {
        if (usedTargetIndices.has(j)) continue;
        
        if (inputWord === targetWords[j]) {
          differences.push({
            type: 'correct',
            text: inputWord,
            position: i
          });
          usedTargetIndices.add(j);
          correctWords++;
          correctCharacters += inputWord.length;
          foundMatch = true;
          break;
        }
      }

      // Chercher une correspondance avec faute de frappe
      if (!foundMatch && options.allowTypos) {
        for (let j = 0; j < targetWords.length; j++) {
          if (usedTargetIndices.has(j)) continue;
          
          if (areWordsSimilar(inputWord, targetWords[j], options.maxTypoDistance || 2)) {
            differences.push({
              type: 'correct',
              text: inputWord,
              position: i,
              expectedText: targetWords[j]
            });
            usedTargetIndices.add(j);
            correctWords++;
            correctCharacters += Math.min(inputWord.length, targetWords[j].length);
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        differences.push({
          type: 'extra',
          text: inputWord,
          position: i
        });
      }
    }

    // Ajouter les mots manquants
    for (let j = 0; j < targetWords.length; j++) {
      if (!usedTargetIndices.has(j)) {
        differences.push({
          type: 'missing',
          text: targetWords[j],
          position: -1, // Position inconnue en mode non strict
          expectedText: targetWords[j]
        });
      }
    }
  }

  // Calculer les métriques
  const wordAccuracy = targetWords.length > 0 ? (correctWords / targetWords.length) * 100 : 0;
  const totalTargetChars = normalizedTarget.replace(/\s/g, '').length;
  const characterAccuracy = totalTargetChars > 0 ? (correctCharacters / totalTargetChars) * 100 : 0;
  
  // Précision globale (moyenne pondérée mots/caractères)
  const accuracy = (wordAccuracy * 0.7) + (characterAccuracy * 0.3);
  
  const levDistance = levenshteinDistance(normalizedInput, normalizedTarget);
  
  // Déterminer si c'est considéré comme correct
  const isMatch = isExactMatch || (accuracy >= (options.minimumAccuracy || 95));

  return {
    isMatch,
    accuracy: Math.round(accuracy),
    differences,
    normalizedInput,
    normalizedTarget,
    levenshteinDistance: levDistance,
    wordAccuracy: Math.round(wordAccuracy),
    characterAccuracy: Math.round(characterAccuracy)
  };
}

/**
 * Compte les caractères communs entre deux mots
 */
function countCommonCharacters(word1: string, word2: string): number {
  const chars1 = word1.split('');
  const chars2 = word2.split('');
  let common = 0;

  for (const char of chars1) {
    const index = chars2.indexOf(char);
    if (index !== -1) {
      common++;
      chars2.splice(index, 1); // Éviter de compter le même caractère plusieurs fois
    }
  }

  return common;
}

/**
 * Suggère des corrections pour un mot incorrect
 */
export function suggestCorrections(
  incorrectWord: string,
  targetWords: string[],
  maxSuggestions: number = 3
): string[] {
  const suggestions: Array<{ word: string; distance: number }> = [];

  for (const targetWord of targetWords) {
    const distance = levenshteinDistance(incorrectWord, targetWord);
    suggestions.push({ word: targetWord, distance });
  }

  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(s => s.word);
}

/**
 * Analyse la complexité d'une phrase pour adapter les critères de comparaison
 */
export function analyzePhraseComplexity(phrase: string): {
  complexity: 'simple' | 'medium' | 'complex';
  wordCount: number;
  avgWordLength: number;
  hasComplexWords: boolean;
  recommendedAccuracy: number;
} {
  const words = phrase.trim().split(/\s+/);
  const wordCount = words.length;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  const hasComplexWords = words.some(word => word.length > 8);

  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  let recommendedAccuracy = 95;

  if (wordCount > 10 || avgWordLength > 6 || hasComplexWords) {
    complexity = 'complex';
    recommendedAccuracy = 90;
  } else if (wordCount > 6 || avgWordLength > 4) {
    complexity = 'medium';
    recommendedAccuracy = 92;
  }

  return {
    complexity,
    wordCount,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    hasComplexWords,
    recommendedAccuracy
  };
}

/**
 * Génère un rapport détaillé de comparaison pour le debugging
 */
export function generateComparisonReport(result: ComparisonResult): string {
  const report = [
    `=== RAPPORT DE COMPARAISON ===`,
    `Résultat: ${result.isMatch ? 'CORRECT' : 'INCORRECT'}`,
    `Précision globale: ${result.accuracy}%`,
    `Précision mots: ${result.wordAccuracy}%`,
    `Précision caractères: ${result.characterAccuracy}%`,
    `Distance Levenshtein: ${result.levenshteinDistance}`,
    ``,
    `Texte normalisé attendu: "${result.normalizedTarget}"`,
    `Texte normalisé saisi: "${result.normalizedInput}"`,
    ``,
    `=== ANALYSE DES DIFFÉRENCES ===`
  ];

  const groupedDifferences = {
    correct: result.differences.filter(d => d.type === 'correct'),
    incorrect: result.differences.filter(d => d.type === 'incorrect'),
    missing: result.differences.filter(d => d.type === 'missing'),
    extra: result.differences.filter(d => d.type === 'extra')
  };

  Object.entries(groupedDifferences).forEach(([type, diffs]) => {
    if (diffs.length > 0) {
      report.push(`${type.toUpperCase()}: ${diffs.map(d => `"${d.text}"`).join(', ')}`);
    }
  });

  return report.join('\n');
}

/**
 * Fonction utilitaire pour la comparaison rapide (compatible avec l'API existante)
 */
export function quickCompare(
  input: string,
  target: string,
  strictMode: boolean = true
): { isCorrect: boolean; accuracy: number; differences: TextDifference[] } {
  const options: ComparisonOptions = {
    ...DEFAULT_COMPARISON_OPTIONS,
    minimumAccuracy: strictMode ? 95 : 85,
    allowTypos: !strictMode
  };

  const result = compareTexts(input, target, options);

  return {
    isCorrect: result.isMatch,
    accuracy: result.accuracy,
    differences: result.differences
  };
}