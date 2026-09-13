#  MenteSana - Aplicación de Salud Mental

Una plataforma integral de salud mental que conecta pacientes con psicólogos, ofrece recursos educativos y proporciona un espacio seguro de comunidad anónima.

##  Características

### Para Pacientes 
- **Check-in emocional diario** - Registra tu estado de ánimo y visualiza tu progreso
- **Agenda de citas** - Conecta con psicólogos y gestiona tus citas
- **Tareas terapéuticas** - Recibe y completa tareas asignadas por tu psicólogo
- **Foro anónimo** - Comparte y apoya a otros en un espacio seguro
- **Diario personal** - Escribe tus pensamientos (opcional: comparte con tu psicólogo)
- **Chat seguro** - Comunícate con tu psicólogo dentro de la app
- **Recursos educativos** - Accede a artículos, videos y ejercicios

### Para Psicólogos 
- **Dashboard profesional** - Visualiza tus estadísticas y pacientes
- **Gestión de pacientes** - Lista de pacientes, notas privadas, historial
- **Asignación de tareas** - Crea y revisa tareas terapéuticas
- **Perfil personalizable** - Muestra tu experiencia y especialización
- **Posts de contenido** - Publica para atraer nuevos pacientes
- **Estadísticas** - Visualiza vistas de perfil y métricas

### Para Administradores 
- **Verificación de psicólogos** - Aprueba o rechaza solicitudes
- **Gestión de usuarios** - Administra roles y usuarios
- **Moderación del foro** - Mantén un espacio seguro

##  Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend Mobile** | React Native + Expo (TypeScript) |
| **Navegación** | React Navigation (Stack + Bottom Tabs) |
| **Backend/Database** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Autenticación** | Supabase Auth (Email, Google, Apple) |
| **Notificaciones** | Expo Notifications (Push + Locales) |
| **Almacenamiento** | Supabase Storage |
| **Tiempo Real** | Supabase Realtime (Chat, Foro) |

##  Estructura del Proyecto

```
MentalHealthApp/
├── App.tsx                          # Entry point
├── supabase/
│   └── schema.sql                   # DB schema + RLS + triggers
├── app.json                         # Expo config
├── package.json                     # Dependencies
├── .env.example                     # Variables de entorno
│
└── src/
    ├── lib/                         # Clientes (Supabase)
    ├── types/                       # Interfaces TypeScript
    ├── constants/                   # Colores, temas, config
    ├── contexts/                    # React Contexts (Auth)
    ├── services/                    # API services (8 archivos)
    ├── components/common/           # UI components (5)
    ├── navigation/                  # Navigators (5)
    └── screens/                     # Screens (25+)
        ├── auth/                    # Login, Register, RoleSelect
        ├── guest/                   # Home, Resources, Psychologists
        ├── patient/                 # Dashboard, Citas, Tareas, Foro...
        ├── psychologist/            # Dashboard, Patients, Tasks...
        ├── admin/                   # Dashboard, Verify, Users...
        └── shared/                  # Chat, Profile, Crisis, Notifications
```

##  Setup y Ejecución

### Prerrequisitos

- **Node.js** v18+
- **npm** o **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Cuenta en Supabase** (gratuita en [supabase.com](https://supabase.com))

### Paso 1: Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve al **SQL Editor** y ejecuta todo el contenido de `supabase/schema.sql`
3. Configura **Authentication Providers**:
   - Ve a Authentication > Settings
   - Habilita Email/Password
   - Habilita Google (necesitas Client ID de Google Cloud Console)
   - Habilita Apple (para iOS)
4. Crea un **bucket de Storage** llamado `task-files` para los archivos de tareas
5. Copia las credenciales de **Settings > API**:
   - `Project URL` (SUPABASE_URL)
   - `anon public key` (SUPABASE_ANON_KEY)

### Paso 2: Configurar el proyecto

```bash
# Clonar el proyecto
cd MentalHealthApp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Iniciar en modo desarrollo
npx expo start
```

### Paso 3: Ejecutar en dispositivo

- **iOS**: Escanea el QR con la cámara o presiona `i` para abrir en simulador
- **Android**: Escanea el QR con la app Expo Go o presiona `a` para emulador

##  Modelo de Roles y Permisos

| Rol | Acceso |
|-----|--------|
| **Invitado** | Contenido educativo, perfiles de psicólogos (vista limitada), leer foro |
| **Paciente** | Todo lo de invitado + agendar citas, chat con psicólogo, tareas, foro, mood tracker, diario |
| **Psicólogo** | Dashboard profesional, gestión de pacientes, asignar tareas, perfil personalizable, posts |
| **Admin** | Verificación de psicólogos, gestión de usuarios, moderación del foro, estadísticas |

La seguridad se maneja mediante **Row Level Security (RLS)** de PostgreSQL directamente en la base de datos.

##  Licencia

Proyecto privado - Todos los derechos reservados.

##  Líneas de Crisis (Ecuador)

Si estás en un momento de crisis, llama a:
- **Línea 171 opción 6**: apoyo psicológico gratuito del Ministerio de Salud Pública
- **ECU 911**: emergencias (policía, ambulancia, bomberos)
- **SAMU — Cruz Roja**: 131 (emergencia médica)
- **Internacional**: visita iasp.info/resources/Crisis_Centres
