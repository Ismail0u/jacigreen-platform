import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'

const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000'
const apiUrl = DEFAULT_API_URL

interface Mission {
  id: string
  name: string
  description?: string
  status: string
  mission_date?: string
  created_at: string
  completed_at?: string
  notes?: string
}

export default function App() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [loadingMissions, setLoadingMissions] = useState(true)
  const [loadingMission, setLoadingMission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchMissions()
  }, [])

  useEffect(() => {
    if (!selectedMissionId) {
      setSelectedMission(null)
      return
    }

    void fetchMissionDetails(selectedMissionId)
  }, [selectedMissionId])

  async function fetchMissions() {
    setLoadingMissions(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/v1/missions`)
      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }
      const data = await response.json()
      setMissions(data)
    } catch (err) {
      setError('Impossible de charger la liste des missions. Vérifiez que le backend est démarré.')
    } finally {
      setLoadingMissions(false)
    }
  }

  async function fetchMissionDetails(missionId: string) {
    setLoadingMission(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/v1/missions/${missionId}`)
      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }
      const data = await response.json()
      setSelectedMission(data)
    } catch (err) {
      setError('Impossible de charger les détails de la mission.')
      setSelectedMission(null)
    } finally {
      setLoadingMission(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>JACIGREEN Mobile</Text>
      <Text style={styles.subtitle}>Prototype Expo / API mission</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loadingMissions ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Chargement des missions…</Text>
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.missionCard, selectedMissionId === item.id && styles.missionCardActive]}
              onPress={() => setSelectedMissionId(item.id)}
            >
              <Text style={styles.missionName}>{item.name}</Text>
              <Text style={styles.missionSubtitle}>{item.status}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune mission disponible</Text>}
        />
      )}

      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Détails de la mission</Text>
        {loadingMission ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : selectedMission ? (
          <ScrollView>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nom</Text>
              <Text style={styles.detailValue}>{selectedMission.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Statut</Text>
              <Text style={styles.detailValue}>{selectedMission.status}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{selectedMission.mission_date ?? 'Non définie'}</Text>
            </View>
            {selectedMission.description ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedMission.description}</Text>
              </View>
            ) : null}
            {selectedMission.notes ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selectedMission.notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>Sélectionnez une mission pour afficher les détails.</Text>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#475569',
    marginBottom: 20,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 16,
  },
  missionCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  missionCardActive: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  missionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  missionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  emptyText: {
    padding: 16,
    color: '#475569',
  },
  detailsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
  },
})
