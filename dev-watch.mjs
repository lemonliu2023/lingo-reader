#!/usr/bin/env node
/* eslint-disable node/prefer-global/process */
/* eslint-disable no-console */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packages = ['shared', 'epub-parser', 'mobi-parser', 'fb2-parser']

console.log('🚀 启动开发模式...')
console.log('📦 监听包:', packages.join(', '))
console.log('🌐 启动前端开发服务器...')

// 存储所有子进程
const processes = []

// 清理函数
function cleanup() {
  console.log('\n🛑 正在停止所有进程...')
  processes.forEach((proc) => {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM')
    }
  })
  process.exit(0)
}

// 监听退出信号
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// 启动包的监听构建
packages.forEach((pkg) => {
  const proc = spawn('pnpm', ['run', 'build', '--watch'], {
    cwd: join(__dirname, 'packages', pkg),
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  proc.stdout.on('data', (data) => {
    console.log(`📦 [${pkg}] ${data.toString().trim()}`)
  })

  proc.stderr.on('data', (data) => {
    console.error(`❌ [${pkg}] ${data.toString().trim()}`)
  })

  proc.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ [${pkg}] 进程退出，代码: ${code}`)
    }
  })

  processes.push(proc)
})

// 等待一下让包先构建
setTimeout(() => {
  // 启动前端开发服务器
  const viteProc = spawn('pnpm', ['run', 'dev'], {
    cwd: join(__dirname, 'reader-html'),
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  viteProc.stdout.on('data', (data) => {
    console.log(`🌐 [vite] ${data.toString().trim()}`)
  })

  viteProc.stderr.on('data', (data) => {
    console.error(`❌ [vite] ${data.toString().trim()}`)
  })

  viteProc.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ [vite] 进程退出，代码: ${code}`)
    }
    cleanup()
  })

  processes.push(viteProc)
}, 2000)

console.log('\n✨ 开发环境已启动!')
console.log('📝 修改 packages/ 中的文件会自动重新构建')
console.log('🔄 前端会自动热重载')
console.log('🛑 按 Ctrl+C 停止所有进程')
