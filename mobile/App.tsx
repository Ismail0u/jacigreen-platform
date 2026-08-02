import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'

import { login, getSession, logout } from './src/services/auth'
import { fetchMissions } from './src/services/api'
import { getMissions, initDatabase, saveMissions, savePhoto } from './src/services/database'
import { syncPhotos } from './src/services/sync'
import type { AuthSession, Mission } from './src/types'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [offline, setOffline] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    try {
      await initDatabase()
      const storedSession = await getSession()
      setSession(storedSession)
      if (storedSession) await refreshMissions(storedSession)
    } catch {
      Alert.alert('Initialisation impossible', 'Les données locales ne peuvent pas être ouvertes.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshMissions(activeSession = session) {
    if (!activeSession) return
    try {
      const remoteMissions = await fetchMissions(activeSession)
      await saveMissions(remoteMissions)
      setMissions(remoteMissions)
      setOffline(false)
    } catch {
      const cachedMissions = await getMissions()
      setMissions(cachedMissions)
      setOffline(true)
      if (!cachedMissions.length) Alert.alert('Hors connexion', 'Aucune mission n’a encore été synchronisée sur cet appareil.')
    }
  }

  async function handleLogin(email: string, password: string) {
    const nextSession = await login(email, password)
    setSession(nextSession)
    await refreshMissions(nextSession)
  }

  async function handleSync() {
    if (!session) return
    setSyncing(true)
    try {
      const result = await syncPhotos(session, selectedMission?.id)
      await refreshMissions(session)
      Alert.alert('Synchronisation terminée', `${result.uploaded} photo(s) envoyée(s), ${result.failed} en attente.`)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!session) return <LoginScreen onLogin={handleLogin} />
  if (cameraOpen && selectedMission) {
    return <CaptureScreen mission={selectedMission} onClose={() => setCameraOpen(false)} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>JACIGREEN</Text>
          <Text style={styles.subtitle}>{offline ? 'Mode hors ligne — cache local' : 'Missions synchronisées'}</Text>
        </View>
        <TouchableOpacity onPress={() => void logout().then(() => setSession(null))} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Quitter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <ActionButton label="Actualiser" onPress={() => void refreshMissions()} />
        <ActionButton label={syncing ? 'Envoi…' : 'Synchroniser'} disabled={syncing} onPress={() => void handleSync()} />
      </View>

      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, selectedMission?.id === item.id && styles.cardSelected]} onPress={() => setSelectedMission(item)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.status}>{item.status}</Text>
            {item.mission_date ? <Text style={styles.cardDate}>{new Date(item.mission_date).toLocaleDateString('fr-FR')}</Text> : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune mission disponible.</Text>}
      />

      <View style={styles.details}>
        {selectedMission ? (
          <>
            <Text style={styles.detailsTitle}>{selectedMission.name}</Text>
            <Text style={styles.detailsText}>{selectedMission.description || 'Aucune description.'}</Text>
            <ActionButton label="Prendre une photo GPS" onPress={() => setCameraOpen(true)} />
          </>
        ) : <Text style={styles.empty}>Sélectionnez une mission pour capturer des photos.</Text>}
      </View>
    </SafeAreaView>
  )
}

function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      await onLogin(email.trim(), password)
    } catch (error) {
      Alert.alert('Connexion impossible', error instanceof Error ? error.message : 'Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, styles.login]}>
      <Text style={styles.title}>JACIGREEN</Text>
      <Text style={styles.subtitle}>Accès terrain sécurisé</Text>
      <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="Adresse e-mail" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} secureTextEntry placeholder="Mot de passe" value={password} onChangeText={setPassword} />
      <ActionButton label={submitting ? 'Connexion…' : 'Se connecter'} disabled={submitting || !email || !password} onPress={() => void submit()} />
    </SafeAreaView>
  )
}

function CaptureScreen({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const camera = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function capture() {
    if (!camera.current) return
    setSaving(true)
    try {
      const locationPermission = await Location.requestForegroundPermissionsAsync()
      if (locationPermission.status !== 'granted') throw new Error('La permission GPS est nécessaire pour cette photo.')
      const [photo, location] = await Promise.all([
        camera.current.takePictureAsync({ quality: 0.8 }),
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      ])
      await savePhoto({
        mission_id: mission.id,
        filename: `jacigreen_${Date.now()}.jpg`,
        uri: photo.uri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude_m: location.coords.altitude,
      })
      setPreview(photo.uri)
      Alert.alert('Photo enregistrée', 'Elle sera envoyée lors de la prochaine synchronisation.')
    } catch (error) {
      Alert.alert('Capture impossible', error instanceof Error ? error.message : 'Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  if (!permission) return <LoadingScreen />
  if (!permission.granted) {
    return <SafeAreaView style={[styles.container, styles.login]}><Text style={styles.empty}>L’accès à la caméra est nécessaire.</Text><ActionButton label="Autoriser la caméra" onPress={() => void requestPermission()} /></SafeAreaView>
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView ref={camera} style={styles.camera} facing="back" />
      {preview ? <Image source={{ uri: preview }} style={styles.preview} /> : null}
      <View style={styles.cameraControls}>
        <ActionButton label="Retour" onPress={onClose} />
        <ActionButton label={saving ? 'Enregistrement…' : 'Capturer + GPS'} disabled={saving} onPress={() => void capture()} />
      </View>
    </View>
  )
}

function LoadingScreen() {
  return <SafeAreaView style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#157a45" /><Text style={styles.subtitle}>Chargement…</Text></SafeAreaView>
}

function ActionButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} disabled={disabled} onPress={onPress}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6faf7', padding: 20 },
  center: { justifyContent: 'center', alignItems: 'center' },
  login: { justifyContent: 'center', gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { color: '#125c35', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  subtitle: { color: '#5b6b60', marginTop: 4 },
  logoutButton: { padding: 10 }, logoutText: { color: '#b42318', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  button: { flexGrow: 1, backgroundColor: '#157a45', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.55 }, buttonText: { color: '#fff', fontWeight: '700' },
  list: { paddingBottom: 8 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginVertical: 5, borderWidth: 1, borderColor: '#dbe8df' },
  cardSelected: { borderColor: '#157a45', borderWidth: 2 }, cardTitle: { fontSize: 16, fontWeight: '700', color: '#193125' },
  status: { color: '#157a45', textTransform: 'capitalize', marginTop: 4 }, cardDate: { color: '#68756d', marginTop: 4 },
  details: { backgroundColor: '#e8f3ec', borderRadius: 12, padding: 16, minHeight: 132 }, detailsTitle: { fontWeight: '800', fontSize: 17, color: '#193125' }, detailsText: { color: '#405448', marginTop: 5 },
  empty: { color: '#5b6b60', textAlign: 'center', padding: 16 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd9d0', borderRadius: 10, padding: 13 },
  cameraContainer: { flex: 1, backgroundColor: '#000' }, camera: { flex: 1 }, cameraControls: { padding: 18, backgroundColor: '#10271a', flexDirection: 'row', gap: 10 }, preview: { position: 'absolute', top: 56, right: 20, width: 76, height: 104, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
})
