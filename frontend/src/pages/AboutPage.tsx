export function AboutPage() {
  return <main className="page-shell about-page">
    <section className="about-hero"><p className="eyebrow">JACIGREEN Africa</p><h1>Surveiller les eaux, protéger les écosystèmes.</h1><p>JACIGREEN transforme les relevés terrain et les images de drone en informations cartographiques utiles pour lutter contre la jacinthe d’eau et les plantes envahissantes au Niger.</p></section>
    <section className="about-grid">
      <article className="panel"><h2>1. Préparer</h2><p>L’administrateur crée une mission, définit sa zone et affecte le collaborateur qui intervient sur le terrain.</p></article>
      <article className="panel"><h2>2. Collecter</h2><p>Les prises de vue géolocalisées sont importées, contrôlées puis placées sur la carte de la mission.</p></article>
      <article className="panel"><h2>3. Analyser</h2><p>L’IA analyse les images et produit des détections exploitables, avec un niveau de confiance pour chaque observation.</p></article>
      <article className="panel"><h2>4. Décider</h2><p>Le rapport consolide photos et détections afin de prioriser les interventions et suivre l’évolution des zones.</p></article>
    </section>
    <section className="panel about-principles"><h2>Une solution conçue pour le terrain</h2><ul><li>Cartographie centralisée des missions et zones surveillées.</li><li>Gestion des accès pour les équipes opérationnelles.</li><li>Détection assistée par IA, vérifiable par les experts.</li><li>Architecture évolutive pour l’usage web et mobile hors connexion.</li></ul></section>
  </main>
}
