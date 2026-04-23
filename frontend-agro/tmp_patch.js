const fs = require('fs');
const path = require('path');

const agriPages = [
  'agricultor/nuevo-producto/nuevo-producto',
  'agricultor/pedidos/pedidos',
  'agricultor/mensajes/mensajes',
  'agricultor/estadisticas/estadisticas',
  'agricultor/configuracion/configuracion',
  'agricultor/editar-producto/editar-producto'
];

const buyerPages = [
  'comprador/valoraciones/valoraciones',
  'comprador/mis-pedidos/mis-pedidos',
  'comprador/mensajes/mensajes',
  'comprador/favoritos/favoritos',
  'comprador/configuracion/configuracion'
];

function processPages(pages, sidebarTag) {
  pages.forEach(page => {
    const htmlPath = path.join('c:/Users/Adrian de Celis/Documents/AgroConecta/frontend-agro/src/app', page + '.html');
    const tsPath = path.join('c:/Users/Adrian de Celis/Documents/AgroConecta/frontend-agro/src/app', page + '.ts');

    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      let changed = false;

      if (!html.includes('sidebarOpen')) {
        html = html.replace(new RegExp(`<div class="dashboard-layout">\\r?\\n\\s*<${sidebarTag}></${sidebarTag}>`), `<div class="dashboard-layout">\n  <div class="sidebar-overlay" [class.active]="sidebarOpen" (click)="sidebarOpen = false"></div>\n  <${sidebarTag} [(isOpen)]="sidebarOpen"></${sidebarTag}>`);
        
        html = html.replace(new RegExp(`<div class="dashboard-layout">\\r?\\n\\s*<${sidebarTag} />`), `<div class="dashboard-layout">\n  <div class="sidebar-overlay" [class.active]="sidebarOpen" (click)="sidebarOpen = false"></div>\n  <${sidebarTag} [(isOpen)]="sidebarOpen" />`);
        changed = true;
      }

      if (!html.includes('topbar-hamburger')) {
        html = html.replace(new RegExp(`<div class="topbar-left">\\r?\\n\\s*<h1 class="page-title">`), `<div class="topbar-left">\n        <button class="topbar-hamburger" (click)="toggleSidebar()" aria-label="Abrir menú">\n          <span class="material-symbols-rounded">menu</span>\n        </button>\n        <h1 class="page-title">`);
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(htmlPath, html);
        console.log('Updated HTML:', htmlPath);
      }
    }

    if (fs.existsSync(tsPath)) {
      let ts = fs.readFileSync(tsPath, 'utf8');
      if (!ts.includes('sidebarOpen = false;')) {
        ts = ts.replace(/(export class \w+ implements \w+ \{)/, `$1\n  sidebarOpen = false;\n  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }`);
        fs.writeFileSync(tsPath, ts);
        console.log('Updated TS:', tsPath);
      }
    }
  });
}

processPages(agriPages, 'app-sidebar');
processPages(buyerPages, 'app-sidebar-comprador');
