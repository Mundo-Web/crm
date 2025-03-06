// vite.config.js
import { defineConfig } from "file:///C:/xampp/htdocs/crm.atalaya/node_modules/vite/dist/node/index.js";
import laravel from "file:///C:/xampp/htdocs/crm.atalaya/node_modules/laravel-vite-plugin/dist/index.js";
import glob from "file:///C:/xampp/htdocs/crm.atalaya/node_modules/glob/glob.js";
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
    })
  ],
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
    return pages[`./Pages/${name}.jsx`];
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcY3JtLmF0YWxheWFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHhhbXBwXFxcXGh0ZG9jc1xcXFxjcm0uYXRhbGF5YVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzoveGFtcHAvaHRkb2NzL2NybS5hdGFsYXlhL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgbGFyYXZlbCBmcm9tICdsYXJhdmVsLXZpdGUtcGx1Z2luJztcbmltcG9ydCBnbG9iIGZyb20gJ2dsb2InO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHNlcnZlcjoge1xuICAgICAgICB3YXRjaDoge1xuICAgICAgICAgICAgaWdub3JlZDogWychKiovbm9kZV9tb2R1bGVzL3lvdXItcGFja2FnZS1uYW1lLyoqJ10sXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgbGFyYXZlbCh7XG4gICAgICAgICAgICBpbnB1dDogZ2xvYi5zeW5jKCdyZXNvdXJjZXMvanMvKi5qc3gnKSxcbiAgICAgICAgICAgIHJlZnJlc2g6IHRydWUsXG4gICAgICAgIH0pLFxuICAgIF0sXG4gICAgcmVzb2x2ZTogbmFtZSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2VzID0gaW1wb3J0Lm1ldGEuZ2xvYignLi9QYWdlcy8qKi8qLmpzeCcsIHsgZWFnZXI6IHRydWUgfSlcbiAgICAgICAgcmV0dXJuIHBhZ2VzW2AuL1BhZ2VzLyR7bmFtZX0uanN4YF1cbiAgICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlEsU0FBUyxvQkFBb0I7QUFDeFMsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sVUFBVTtBQUVqQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixRQUFRO0FBQUEsSUFDSixPQUFPO0FBQUEsTUFDSCxTQUFTLENBQUMsdUNBQXVDO0FBQUEsSUFDckQ7QUFBQSxFQUNKO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDSixPQUFPLEtBQUssS0FBSyxvQkFBb0I7QUFBQSxNQUNyQyxTQUFTO0FBQUEsSUFDYixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsU0FBUyxVQUFRO0FBQ2IsVUFBTSxRQUFRLFlBQVksS0FBSyxvQkFBb0IsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNsRSxXQUFPLE1BQU0sV0FBVyxJQUFJLE1BQU07QUFBQSxFQUN0QztBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
