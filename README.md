# YouTube Faceless — Dashboard Web (Next.js / Vercel)

Panel de control para monitorizar y controlar `faceless_yt_pipeline` desde
cualquier navegador. Vercel es "serverless" (no tiene acceso al disco de tu
Mac), así que este dashboard habla con una base de datos Redis (Upstash)
que hace de puente: `scripts/sync_dashboard.py`, corriendo cada 1-2 minutos
por cron en tu Mac, empuja el estado real (cola, historial, cuota) y
recoge las acciones que hagas desde la web (añadir un tema, pedir "generar
ahora").

```
Tu Mac (cron, pipeline real)  <--->  Upstash Redis  <--->  Dashboard en Vercel
   scripts/sync_dashboard.py           (base de datos            (Next.js)
                                         compartida)
```

## 1. Crear la base de datos Redis (Upstash)

1. Ve a https://vercel.com → tu proyecto → pestaña **Storage** → **Create
   Database** → elige **Upstash** (Redis, plan gratuito de sobra para esto).
   (Alternativa sin pasar por Vercel: crea la base de datos directamente en
   https://console.upstash.com — es la misma tecnología.)
2. Cuando la crees desde Vercel y la conectes al proyecto, Vercel añade
   automáticamente las variables `UPSTASH_REDIS_REST_URL` y
   `UPSTASH_REDIS_REST_TOKEN` (a veces con otro prefijo, tipo `KV_REST_API_URL`
   — si es así, renombralas o añade también las que usa este proyecto:
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) a las variables de
   entorno del proyecto.
3. Copia esas MISMAS dos variables al `.env` de tu Mac (junto a las demás
   claves del pipeline), para que `scripts/sync_dashboard.py` hable con la
   misma base de datos:
   ```
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxx
   ```

## 2. Variables de entorno del proyecto Next.js

En Vercel → tu proyecto → **Settings → Environment Variables**, añade:

| Variable | Valor |
|---|---|
| `UPSTASH_REDIS_REST_URL` | (del paso 1) |
| `UPSTASH_REDIS_REST_TOKEN` | (del paso 1) |
| `DASHBOARD_PASSWORD` | una contraseña larga, solo para ti |
| `DASHBOARD_API_TOKEN` | un token aleatorio largo, ej. `openssl rand -hex 32` |

Para desarrollo local, copia `web/.env.example` como `web/.env.local` y
rellena los mismos valores.

## 3. Instalar dependencias y comprobar el build localmente

```bash
cd web
npm install
npm run build
```

Si el build termina sin errores (`✓ Compiled successfully`), está listo
para desplegar. Para probarlo en tu navegador antes de desplegar:

```bash
npm run dev
# abre http://localhost:3000
```

## 4. Desplegar en Vercel (Vercel CLI)

```bash
npm install -g vercel        # una vez, si no lo tienes
cd web
vercel login                 # una vez
vercel link                  # conecta esta carpeta con un proyecto de Vercel
vercel env pull .env.local   # opcional: trae las env vars ya puestas en Vercel

vercel --prod                # despliega a producción
```

`vercel link` te preguntará si quieres crear un proyecto nuevo o
conectarte a uno existente — si ya creaste el proyecto en el paso 1 para
la base de datos, elige ese mismo.

Cada vez que cambies algo en `web/`, repite `vercel --prod` desde esta
carpeta (o conecta el repo a GitHub desde Vercel para que despliegue solo
en cada `git push`).

## 5. Activar la sincronización en el Mac

En el Mac, dentro de la carpeta del proyecto (no de `web/`):

```bash
cd ~/Documents/faceless_yt_pipeline
source venv/bin/activate
pip install -r requirements.txt   # instala requests/python-dotenv si faltan
python3 scripts/sync_dashboard.py # prueba manual: no debe dar error
./scripts/install_dashboard_sync_cron.sh   # instala el cron cada 2 minutos
```

A partir de aquí, el dashboard en Vercel debería mostrar tu cola de temas,
historial y cuota reales en menos de 2 minutos. Añadir un tema o pulsar
"Generar ahora" desde la web tarda igualmente hasta 2 minutos en
reflejarse en el Mac (es el ciclo de `sync_dashboard.py`).

## Qué hace cada endpoint

- `GET /api/queue` — cola de temas actual + temas añadidos desde la web
  aún no sincronizados.
- `POST /api/queue` `{ "topic": "..." }` — añade un tema (se incorpora a
  `topics_queue.txt` en el próximo ciclo de sync).
- `GET /api/history` — últimas publicaciones (de `publish_history.jsonl`).
- `GET /api/status` — fase actual del job, cuota de YouTube, estado de
  servicios (proveedor de TTS activo, privacidad por defecto...).
- `POST /api/trigger` `{ "format": "short" | "long" }` — pide generación
  inmediata; el Mac la lanza (`scripts/next_video.sh <formato>`) en su
  próximo ciclo de sync.

Todas las rutas (excepto `/login` y `/api/login`) requieren sesión (cookie
tras el login) o un header `Authorization: Bearer <DASHBOARD_API_TOKEN>`.

## Seguridad

Este panel está pensado para un solo usuario (tú). La autenticación es
intencionadamente simple (una contraseña compartida) — no lo uses para un
equipo sin añadir autenticación real. No expongas `DASHBOARD_API_TOKEN` ni
las credenciales de Upstash en el frontend ni en repos públicos.
