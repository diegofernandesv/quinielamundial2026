# Quiniela Mundial 2026

Plataforma de predicciones para el Mundial FIFA 2026 (USA, México & Canadá). Construida con Next.js 16, Supabase, Tailwind CSS v4 y shadcn/ui base-nova.

## Stack

- **Next.js 16** (App Router, Server Components, React 19)
- **TypeScript** estricto
- **Supabase** — PostgreSQL, Auth, RLS, Realtime
- **Tailwind CSS v4** + **shadcn/ui** (base-nova style + Base UI primitives)
- **React Hook Form** + **Zod** para formularios
- **sonner** para notificaciones toast
- **next-themes** para dark/light mode
- **date-fns** para manejo de fechas

## Configuración

### 1. Clonar e instalar

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
# Editar con tus claves de Supabase
```

### 3. Base de datos Supabase

En el **SQL Editor** de tu proyecto Supabase, ejecuta el archivo `supabase-schema.sql` completo.

Incluye:
- 14 tablas con RLS, índices y constraints
- Triggers para `updated_at`, auto-perfil, lock de predicciones
- Funciones `calculate_prediction_points`, `score_match_predictions`, `recalculate_leaderboard`
- Trigger automático que calcula puntos y actualiza leaderboard cuando un partido se marca como `finished`
- Seed de grupos A–L

### 4. Crear super_admin

Después de registrarte, ejecuta en Supabase SQL:
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'tu@email.com';
```

### 5. Correr en desarrollo

```bash
npm run dev
```

## Estructura de carpetas

```
src/
├── app/
│   ├── (auth)/             # Login, Register (sin shell)
│   │   ├── login/
│   │   └── register/
│   ├── (private)/          # Auth guard
│   │   ├── (shell)/        # Con AppShell sin poolId
│   │   │   ├── dashboard/
│   │   │   ├── pools/
│   │   │   └── profile/
│   │   └── pools/[poolId]/ # Con AppShell + sidebar de quiniela
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── predictions/
│   │       ├── leaderboard/
│   │       ├── groups/
│   │       ├── bracket/
│   │       ├── bonus/
│   │       ├── rules/
│   │       └── settings/
│   ├── (admin)/            # Solo super_admin
│   │   └── admin/
│   │       ├── teams/
│   │       ├── matches/
│   │       ├── results/
│   │       ├── users/
│   │       └── recalculate/
│   └── join/[inviteCode]/  # Página pública de invitación
├── components/
│   ├── ui/                 # shadcn/ui (base-nova + Base UI)
│   ├── layout/             # AppShell, Sidebar, UserAvatar
│   ├── pools/              # PoolCard, InviteMemberDialog
│   ├── predictions/        # MatchPredictionCard, ScoreInput
│   ├── leaderboard/        # LeaderboardTable
│   ├── groups/             # GroupStandingsTable
│   └── bracket/            # BracketView
├── lib/
│   ├── supabase/           # client.ts, server.ts
│   ├── utils/              # format.ts, csv.ts, cn.ts
│   ├── scoring.ts          # Lógica de puntos (cliente)
│   └── validations/        # Zod schemas
├── types/
│   └── database.ts         # Todos los tipos TypeScript
└── middleware.ts            # Protección de rutas
```

## Fases de implementación MVP

### Fase 1 ✅ (completada en este scaffold)
- Auth (login/register/middleware/RLS)
- Crear y unirse a quinielas
- Cargar partidos (admin)
- Hacer predicciones con deadline automático
- Leaderboard básico con Export CSV

### Fase 2 (próxima)
- Tabla de grupos calculada en tiempo real
- Bracket visual de eliminatorias
- Predicciones bonus (campeón/subcampeón/semifinalistas)
- Reglas de puntuación custom por quiniela

### Fase 3 (avanzado)
- Realtime con Supabase Channels
- Notificaciones push
- Analytics por usuario/quiniela
- Export PDF/Excel del leaderboard
- Personalización visual avanzada (logo, colores, banner)
- PWA (Progressive Web App)

## Seguridad implementada

- RLS en todas las tablas
- Middleware Next.js protege rutas privadas y admin
- Predicciones bloqueadas automáticamente via trigger al inicio del partido
- Solo `super_admin` puede editar calendario y resultados
- Solo el owner de la pool puede ver/editar configuración
- Validación Zod client-side + constraints PostgreSQL server-side
- Policies: usuarios no pueden ver quinielas privadas sin ser miembros

## Cálculo de puntos

Los puntos se calculan automáticamente vía trigger PostgreSQL cuando `matches.status` cambia a `'finished'`:

1. `score_match_predictions(match_id)` — calcula puntos de cada predicción
2. `recalculate_leaderboard(pool_id)` — actualiza snapshots y posiciones

Fórmula (con reglas default):
- Marcador exacto: **5 pts × multiplicador de fase**
- Resultado correcto: **3 pts × multiplicador**
- Diferencia de goles: **+1 pt**
- Goles exactos de equipo: **+1 pt por equipo**
- Multiplicadores: grupos×1, R32×1.5, R16×2, QF×2.5, SF×3, Final×4
