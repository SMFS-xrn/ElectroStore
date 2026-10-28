// Запускает тесты на ОТДЕЛЬНОЙ базе prisma/test.db (она пересоздаётся при каждом запуске, рабочая база не затрагивается)
import { spawnSync } from 'node:child_process'
const env = { ...process.env, DATABASE_URL: 'file:./test.db', NODE_ENV: 'test', SESSION_SECRET: 'test-secret', RATE_LIMIT_MAX: '1000', CLIENT_ORIGIN: 'http://localhost:5173' }
const run = cmd => { const r = spawnSync(cmd, { stdio: 'inherit', shell: true, env }); if (r.status !== 0) process.exit(r.status || 1) }
run('npx prisma db push --force-reset --skip-generate --accept-data-loss')
run('node --test tests/api.test.js')
