export function AboutPage() {
  const metrics = [
    { value: '4', label: 'Étapes clés' },
    { value: '24/7', label: 'Suivi terrain' },
    { value: 'AI', label: 'Analyse assistée' },
    { value: '100%', label: 'Traçabilité' },
  ]

  const steps = [
    {
      title: 'Préparer',
      description: 'L’administrateur crée la mission, définit la zone et affecte l’équipe terrain selon les priorités opérationnelles.',
    },
    {
      title: 'Collecter',
      description: 'Les prises de vue géolocalisées sont importées, validées puis placées sur la carte de la mission.',
    },
    {
      title: 'Analyser',
      description: 'L’IA détecte les zones infestées et fournit un niveau de confiance pour chaque observation.',
    },
    {
      title: 'Décider',
      description: 'Le rapport consolidé permet de prioriser les interventions et de suivre l’évolution de chaque zone.',
    },
  ]

  const principles = [
    'Cartographie centralisée des missions et des zones surveillées.',
    'Gestion fine des accès pour les équipes opérationnelles.',
    'Détection assistée par IA, vérifiable par les experts terrain.',
    'Architecture évolutive pour le web, le mobile et les usages hors ligne.',
  ]

  return (
    <main className="page-shell about-page">
      <section className="hero-card panel">
        <div className="hero-copy">
          <p className="eyebrow">JACIGREEN Africa</p>
          <h1>Surveiller les eaux, protéger les écosystèmes.</h1>
          <p>
            JACIGREEN transforme les relevés terrain et les images de drone en informations utiles pour
            lutter contre la jacinthe d’eau et les plantes envahissantes au Niger.
          </p>
        </div>

        <div className="stats-grid" aria-label="Indicateurs de la solution">
          {metrics.map((metric) => (
            <div key={metric.label} className="stat-item">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-grid">
        {steps.map((step, index) => (
          <article key={step.title} className="panel feature-card">
            <span className="feature-number">0{index + 1}</span>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
          </article>
        ))}
      </section>

      <section className="panel about-principles">
        <div className="section-header">
          <div>
            <p className="eyebrow eyebrow--dark">Approche</p>
            <h2>Une solution conçue pour le terrain</h2>
          </div>
        </div>

        <ul className="principles-list">
          {principles.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
