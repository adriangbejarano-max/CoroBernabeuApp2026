# Configuracion Supabase

## 1. Crear tablas

En Supabase:

1. Abre el proyecto `gigyedpxszdjmzjnqypa`.
2. Ve a **SQL Editor**.
3. Crea una query nueva.
4. Copia y ejecuta el contenido de `supabase-schema.sql`.

Esto crea:

- `profiles`
- `events`
- `attendees`
- `checkins`
- politicas RLS
- eventos iniciales

## 2. Crear usuario administrador inicial

En Supabase:

1. Ve a **Authentication** > **Users**.
2. Pulsa **Add user**.
3. Crea tu usuario administrador con email y contrasena.
4. Copia el `User UID`.

Despues ejecuta en **SQL Editor**:

```sql
insert into public.profiles (id, full_name, email, role)
values ('PEGA_AQUI_EL_USER_UID', 'Administrador Coro', 'tu-email@dominio.com', 'admin')
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role;
```

## 3. Activar creacion de usuarios desde la app

La app incluye una Edge Function segura en:

```text
supabase/functions/create-user/index.ts
```

Esta funcion permite que un administrador cree usuarios con rol `user` o `admin`.

Para desplegarla:

```bash
supabase login
supabase link --project-ref gigyedpxszdjmzjnqypa
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
supabase functions deploy create-user
```

La `SUPABASE_SERVICE_ROLE_KEY` se copia desde **Project Settings > API > service_role**. No la pongas nunca en `app.js`, GitHub ni Vercel.

## 4. Importar asistentes del Excel

El archivo `data/import-attendees.sql` ya esta generado desde `data/asistentes.xlsx`.

En Supabase:

1. Ve a **SQL Editor**.
2. Crea una query nueva.
3. Pega el contenido de `data/import-attendees.sql`.
4. Ejecuta la query.

Esto cargara 1220 asistentes. El mapeo usado es:

- `NOMBRE` + `APELLIDOS` -> `full_name`
- `DNI` -> `dni`
- `TELÉFONO MÓVIL` -> `phone`
- `CORREO ELECTRÓNICO` -> `email`
- `FECHA DE NACIMIENTO` -> `birth_date`
- `Parroquia, colegio, movimiento...` -> `group_name`
- `ACREDITACIÓN` -> `accreditation`
- `CARGO` -> categoria visual de la app

## 5. Probar la app

Sirve la carpeta:

```bash
python3 -m http.server 4174
```

Abre:

```text
http://localhost:4174
```

Entra con el usuario creado en Supabase Auth.

Si no has creado las tablas o usuarios todavia, la app seguira funcionando en modo local con los usuarios demo.
