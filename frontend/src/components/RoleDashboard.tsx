import { useMemo, useState } from 'react'

/**
 * RoleDashboard is a React component that displays a dashboard based on the user's role, either 'admin' or 'collaborator'. It provides a summary of the actions and permissions available to each role. The component allows users to switch between the two roles using buttons, updating the displayed summary accordingly. The useMemo hook is used to optimize performance by memoizing the summary data based on the selected role. This component is useful for providing users with a clear understanding of their capabilities within the application, enhancing user experience and role-based access control. 
 * comments: The RoleDashboard component is designed to be simple and intuitive, making it easy for users to understand their role-specific functionalities. It can be further enhanced by integrating with the application's state management to reflect real-time changes in user roles or permissions. Additionally, styling can be improved to match the overall design language of the application, ensuring a cohesive user interface.
 * design decisions: The decision to use buttons for role switching was made to provide a clear and immediate way for users to view the different capabilities associated with each role. The useMemo hook was chosen to prevent unnecessary recalculations of the summary data, improving performance when the component re-renders. The component's layout is kept simple and clean, focusing on clarity and ease of use.
 * security considerations: While the RoleDashboard component itself does not handle sensitive data, it is important to ensure that role-based access control is enforced at the backend level. Users should not be able to access functionalities or data that they are not authorized for, regardless of what is displayed in the UI. Proper authentication and authorization checks should be implemented in the backend API to prevent unauthorized access.
 * user experience: The RoleDashboard component enhances user experience by providing a clear and concise overview of the actions available to users based on their roles. The ability to switch between roles allows users to understand the differences in permissions and capabilities, fostering a better understanding of their responsibilities within the application. The clean design and straightforward layout contribute to an intuitive user interface, making it easy for users to navigate and comprehend their role-specific functionalities.
 */

interface RoleDashboardProps {
  role: 'admin' | 'collaborator'
}

export function RoleDashboard({ role }: RoleDashboardProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'collaborator'>(role)

  const summary = useMemo(() => {
    if (selectedRole === 'admin') {
      return [
        'Créer et superviser les missions',
        'Lancer l’analyse IA et suivre les résultats',
        'Gérer les collaborateurs et leurs droits',
      ]
    }

    return [
      'Consulter les missions autorisées',
      'Visualiser le rapport de mission',
      'Explorer la carte Leaflet avec les photos et détections',
    ]
  }, [selectedRole])

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setSelectedRole('admin')}>Vue administrateur</button>
        <button onClick={() => setSelectedRole('collaborator')}>Vue collaborateur</button>
      </div>
      <div style={{ padding: 16, borderRadius: 16, background: '#f8fafc' }}>
        <h3>{selectedRole === 'admin' ? 'Administration' : 'Collaboration'}</h3>
        <ul>
          {summary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
