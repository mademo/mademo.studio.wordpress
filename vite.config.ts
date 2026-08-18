import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Détecte si on build pour WordPress
const isWordPressBuild = process.env.BUILD_TARGET === 'wordpress'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Chemin de base pour WordPress — les assets sont servis depuis le thème
  // En mode Make/preview, la base reste '/'
  base: isWordPressBuild
    ? '/wp-content/themes/mademo/dist/'
    : '/',

  build: {
    // Génère le manifest.json requis par functions.php pour trouver les assets hashés
    manifest: true,

    // Dossier de sortie
    outDir: isWordPressBuild
      ? path.resolve(__dirname, 'wordpress/theme/mademo/dist')
      : 'dist',

    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        // Noms prévisibles pour les chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    // Taille cible : avertir au-delà de 800 Ko
    chunkSizeWarningLimit: 800,
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    port: 5173,
    // En dev avec WordPress, autoriser les requêtes cross-origin
    cors: true,
  },
})
