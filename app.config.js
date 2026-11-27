// baseUrl n'est utile que pour la PWA (GitHub Pages). Sur les builds natifs EAS,
// il préfixe les assets par "<slug>/", ce qui entre en collision avec
// l'exécutable de même nom (système de fichiers insensible à la casse).
function productionRoot(value) {
  return value === undefined || value.trim() === '' || value.trim() === '/';
}

module.exports = ({ config }) => {
  if (!config.experiments) return config;
  if (process.env.EAS_BUILD) {
    const { baseUrl, ...rest } = config.experiments;
    config.experiments = rest;
    return config;
  }
  const webBase = process.env.EXPO_PUBLIC_WEB_BASE;
  if (productionRoot(webBase)) {
    const { baseUrl, ...rest } = config.experiments;
    config.experiments = rest;
    return config;
  }
  const trimmed = webBase.trim();
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  config.experiments.baseUrl = withSlash.replace(/\/$/, '');
  return config;
};
