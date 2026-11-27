// baseUrl n'est utile que pour la PWA (GitHub Pages). Sur les builds natifs EAS,
// il préfixe les assets par "<slug>/", ce qui entre en collision avec
// l'exécutable de même nom (système de fichiers insensible à la casse).
module.exports = ({ config }) => {
  if (process.env.EAS_BUILD && config.experiments) {
    const { baseUrl, ...rest } = config.experiments;
    config.experiments = rest;
  }
  const webBase = process.env.EXPO_PUBLIC_WEB_BASE;
  if (webBase !== undefined && config.experiments) {
    if (webBase === '' || webBase === '/') {
      const { baseUrl, ...rest } = config.experiments;
      config.experiments = rest;
    } else {
      config.experiments.baseUrl = webBase;
    }
  }
  return config;
};
