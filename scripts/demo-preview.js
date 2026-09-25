import { existsSync, lstatSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const demo = join(root, '.dev-preview')
const data = join(demo, 'data')
const uploads = join(demo, 'uploads')
if (process.env.NODE_ENV === 'production' || process.env.CMS_DATA_DIR || process.env.CMS_UPLOAD_DIR) {
  throw new Error('Demo preview only runs without production data settings.')
}
for (const path of [demo, data, uploads]) {
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) throw new Error(`Missing or linked demo path: ${path}`)
}
if (!existsSync(join(data, 'cms.db'))) throw new Error('Run pnpm demo:seed first.')
if (!existsSync(join(root, 'dist', 'index.html'))) throw new Error('Run pnpm build first.')
const port = '4173'
const child = spawn(process.execPath, ['server/index.js', '--port', port], {
  cwd: root, stdio: 'inherit', env: {
    ...process.env, NODE_ENV: 'development', CMS_DATA_DIR: data, CMS_UPLOAD_DIR: uploads,
    ADMIN_USER: 'demo', ADMIN_PASS: 'demo-only', SESSION_SECRET: 'local-demo-only-session-secret',
    PUBLIC_URL: `http://localhost:${port}`,
  },
})
console.log(`Demo preview: http://localhost:${port}/admin  (demo / demo-only)`)
child.on('exit', code => { process.exitCode = code ?? 0 })
