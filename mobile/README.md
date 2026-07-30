# JACIGREEN Mobile Prototype

Application Expo offline-first pour les équipes terrain JACIGREEN. Elle permet de se connecter, de consulter les missions mises en cache en SQLite, de capturer une photo avec sa position GPS et de synchroniser les photos en lot lorsque le réseau revient.

## Installation

```bash
cd mobile
npm install
npx expo start
```

## Démarrage

```bash
cd mobile
npm start
```

## Notes

- Définir `EXPO_PUBLIC_API_URL` avec l'URL du backend, par exemple `http://192.168.1.10:8000` pour un téléphone physique sur le même Wi-Fi.
- L'émulateur Android utilise par défaut `http://10.0.2.2:8000`; iOS/web utilisent `http://localhost:8000`.
- Les photos sont conservées localement jusqu'à ce que le bouton **Synchroniser** les envoie à l’API. L’API accepte le GPS du téléphone quand la photo ne contient pas d’EXIF GPS.
