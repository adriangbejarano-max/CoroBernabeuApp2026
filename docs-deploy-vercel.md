# Publicar en Vercel

## Estado de GitHub en esta carpeta

En este workspace, el repo local esta en `main`, pero no tiene commits ni remote configurado.

Comandos comprobados:

```bash
git remote -v
git status --short --branch
```

Resultado relevante:

```text
## No commits yet on main
```

Si lo subiste desde Visual Studio, revisa que Visual Studio estuviera apuntando exactamente a:

```text
/Users/adriangomezbejarano/Documents/CoroBernabeu2026
```

## Subir a GitHub desde esta carpeta

No subas el Excel ni el SQL de importacion: ya estan protegidos por `.gitignore`.

```bash
git add .
git commit -m "Initial Coro Bernabeu check-in app"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si ya existe el remote:

```bash
git remote set-url origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## Publicar con Vercel Dashboard

1. Entra en Vercel.
2. Pulsa **Add New... > Project**.
3. Importa el repositorio de GitHub.
4. Framework Preset: **Other**.
5. Build Command: dejar vacio.
6. Output Directory: dejar vacio o `.`.
7. Pulsa **Deploy**.

La app es HTML/CSS/JS estatico, asi que no necesita build.

Vercel desplegara automaticamente cada push a la rama principal del repositorio.

## Despues de publicar

En Supabase, revisa **Authentication > URL Configuration**.

Anade tu dominio de Vercel en **Site URL** o **Redirect URLs** si usas flujos con redireccion.

Para login con email/contrasena normal, la app puede funcionar sin redireccion, pero conviene dejar el dominio permitido.
