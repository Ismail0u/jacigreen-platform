import { z } from 'zod'

/**
 * Valide les variables d'environnement au demarrage plutot que de laisser
 * une URL API vide/malformee provoquer des erreurs axios confuses en plein
 * milieu de l'app. Fail-fast : si `.env` est mal configure, on le sait tout
 * de suite avec un message clair, pas apres 10 minutes de debug.
 */
const envSchema = z.object({
  VITE_API_URL: z.url({ message: 'VITE_API_URL doit être une URL valide (ex: http://localhost:8000)' }).optional(),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Configuration invalide (.env) :', parsed.error.flatten().fieldErrors)
  throw new Error('Variables d\u2019environnement invalides — vérifiez votre fichier .env')
}

export const env = {
  API_URL: parsed.data.VITE_API_URL || 'http://localhost:8000',
}
