// Public files resolved against Vite's base, so the site works at the domain root in
// development and under /portfolio/ on GitHub Pages.
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
