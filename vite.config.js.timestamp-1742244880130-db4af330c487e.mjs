// vite.config.js
import { defineConfig } from "file:///C:/xampp/htdocs/crm.atalaya/node_modules/vite/dist/node/index.js";
import laravel from "file:///C:/xampp/htdocs/crm.atalaya/node_modules/laravel-vite-plugin/dist/index.js";
import glob from "file:///C:/xampp/htdocs/crm.atalaya/node_modules/glob/glob.js";
import react from "file:///C:/xampp/htdocs/crm.atalaya/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  server: {
    watch: {
      ignored: ["!**/node_modules/your-package-name/**"]
    }
  },
  plugins: [
    laravel({
      input: glob.sync("resources/js/*.jsx"),
      refresh: true
    }),
    react()
  ],
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
    return pages[`./Pages/${name}.jsx`];
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcY3JtLmF0YWxheWFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHhhbXBwXFxcXGh0ZG9jc1xcXFxjcm0uYXRhbGF5YVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzoveGFtcHAvaHRkb2NzL2NybS5hdGFsYXlhL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgbGFyYXZlbCBmcm9tICdsYXJhdmVsLXZpdGUtcGx1Z2luJztcbmltcG9ydCBnbG9iIGZyb20gJ2dsb2InO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgd2F0Y2g6IHtcbiAgICAgICAgICAgIGlnbm9yZWQ6IFsnISoqL25vZGVfbW9kdWxlcy95b3VyLXBhY2thZ2UtbmFtZS8qKiddLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICAgIGxhcmF2ZWwoe1xuICAgICAgICAgICAgaW5wdXQ6IGdsb2Iuc3luYygncmVzb3VyY2VzL2pzLyouanN4JyksXG4gICAgICAgICAgICByZWZyZXNoOiB0cnVlLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVhY3QoKSxcbiAgICBdLFxuICAgIHJlc29sdmU6IG5hbWUgPT4ge1xuICAgICAgICBjb25zdCBwYWdlcyA9IGltcG9ydC5tZXRhLmdsb2IoJy4vUGFnZXMvKiovKi5qc3gnLCB7IGVhZ2VyOiB0cnVlIH0pXG4gICAgICAgIHJldHVybiBwYWdlc1tgLi9QYWdlcy8ke25hbWV9LmpzeGBdXG4gICAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJRLFNBQVMsb0JBQW9CO0FBQ3hTLE9BQU8sYUFBYTtBQUNwQixPQUFPLFVBQVU7QUFDakIsT0FBTyxXQUFXO0FBRWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFFBQVE7QUFBQSxJQUNKLE9BQU87QUFBQSxNQUNILFNBQVMsQ0FBQyx1Q0FBdUM7QUFBQSxJQUNyRDtBQUFBLEVBQ0o7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNKLE9BQU8sS0FBSyxLQUFLLG9CQUFvQjtBQUFBLE1BQ3JDLFNBQVM7QUFBQSxJQUNiLENBQUM7QUFBQSxJQUNELE1BQU07QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTLFVBQVE7QUFDYixVQUFNLFFBQVEsWUFBWSxLQUFLLG9CQUFvQixFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ2xFLFdBQU8sTUFBTSxXQUFXLElBQUksTUFBTTtBQUFBLEVBQ3RDO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
