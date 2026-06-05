# Coro Bernabeu 2026

Primera version de la app de check-in para la gestion de asistentes del coro de la visita del papa Leon XIV en el Santiago Bernabeu.

## Abrir la app

Puedes abrir `index.html` directamente en el navegador o servir la carpeta con:

```bash
python3 -m http.server 4173
```

Luego entra en `http://localhost:4173`.

## Funciones incluidas

- Login con roles de administrador y voluntario.
- Check-in por evento.
- Busqueda rapida por DNI.
- Busqueda avanzada por nombre completo.
- Soporte para varios perfiles con el mismo DNI.
- Panel de resumen por evento y categoria.
- Administrador: crear y editar asistentes, cambiar categoria, crear voluntarios y crear eventos.
- Persistencia local en el navegador con `localStorage`.
- Configuracion preparada para Supabase Auth y tablas cloud.

## Siguiente paso recomendado

Colocar el Excel definitivo en `data/` para mapear sus columnas reales y automatizar la importacion de asistentes.

Ruta recomendada:

```text
data/asistentes.xlsx
```

Columnas ideales: `DNI`, `Nombre completo`, `Categoria`, `Grupo`, `Telefono`, `Notas`.

## Supabase

La app incluye:

- `supabase-config.js` con la URL y publishable key.
- `supabase-schema.sql` para crear tablas, politicas RLS y datos iniciales.
- `data/import-attendees.sql` generado desde `data/asistentes.xlsx`.
- `docs-supabase-setup.md` con los pasos para crear usuarios y publicar.
- `docs-deploy-vercel.md` con los pasos de GitHub y Vercel.
- `supabase/functions/create-user` para crear admins y voluntarios desde la app.

La app requiere usuarios reales de Supabase Auth. No hay login local ni credenciales demo.

Orden recomendado en Supabase SQL Editor:

1. Ejecutar `supabase-schema.sql`.
2. Crear usuarios en Authentication y perfiles en `profiles`.
3. Ejecutar `data/import-attendees.sql` para cargar los 1220 asistentes del Excel.
