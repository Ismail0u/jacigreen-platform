export function AboutPage() {
  const metrics = [
    { value: '4', label: 'Étapes clés' },
    { value: '24/7', label: 'Suivi terrain' },
    { value: 'IA', label: 'Analyse assistée' },
    { value: '100%', label: 'Traçabilité' },
  ]

  const steps = [
    {
      title: 'Préparer',
      description: 'L\u2019administrateur crée la mission, définit la zone et affecte l\u2019équipe terrain selon les priorités opérationnelles.',
    },
    {
      title: 'Collecter',
      description: 'Les prises de vue géolocalisées sont importées, validées puis placées sur la carte de la mission.',
    },
    {
      title: 'Analyser',
      description: 'L\u2019IA détecte les zones infestées et fournit un niveau de confiance pour chaque observation.',
    },
    {
      title: 'Décider',
      description: 'Le rapport consolidé permet de prioriser les interventions et de suivre l\u2019évolution de chaque zone.',
    },
  ]

  const principles = [
    'Cartographie centralisée des missions et des zones surveillées.',
    'Gestion fine des accès pour les équipes opérationnelles.',
    'Détection assistée par IA, vérifiable par les experts terrain.',
    'Architecture évolutive pour le web, le mobile et les usages hors ligne.',
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="grid gap-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-200">JACIGREEN Africa</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Surveiller les eaux, protéger les écosystèmes.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100">
            JACIGREEN transforme les relevés terrain et les images de drone en informations utiles pour
            lutter contre la jacinthe d'eau et les plantes envahissantes au Niger.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3" aria-label="Indicateurs de la solution">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl bg-white/10 p-4 text-center ring-1 ring-white/15">
              <strong className="block text-2xl font-bold">{metric.value}</strong>
              <span className="text-xs font-semibold text-brand-100">{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {steps.map((step, index) => (
          <article key={step.title} className="card">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
              0{index + 1}
            </span>
            <h2 className="mt-3 text-base font-semibold text-slate-900">{step.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.description}</p>
          </article>
        ))}
      </section>

      <section className="card mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Approche</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Une solution conçue pour le terrain</h2>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {principles.map((principle) => (
            <li key={principle} className="flex items-start gap-2.5 text-sm text-slate-600">
              <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500">
                <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
              </svg>
              {principle}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
