import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

// 将 HSL 转换为 HEX 格式的工具函数
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  
  const r = Math.round(255 * f(0))
  const g = Math.round(255 * f(8))
  const b = Math.round(255 * f(4))
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// 解析 HSL 字符串
function parseHSL(hslString: string): { h: number; s: number; l: number } {
  const cleanString = hslString.replace(/hsl\(|\)/g, '').trim()
  const parts = cleanString.split(/\s+/)
  
  if (parts.length !== 3) {
    throw new Error(`Invalid HSL string: ${hslString}`)
  }
  
  const h = parseInt(parts[0])
  const s = parseInt(parts[1].replace('%', ''))
  const l = parseInt(parts[2].replace('%', ''))
  
  if (isNaN(h) || isNaN(s) || isNaN(l)) {
    throw new Error(`Invalid HSL values in: ${hslString}`)
  }
  
  return { h, s, l }
}

// 生成颜色调色板
function generateColorPalette(baseHsl: string) {
  const { h, s, l } = parseHSL(baseHsl)
  
  return {
    50: hslToHex(h, Math.max(0, s - 40), Math.min(100, l + 40)),
    100: hslToHex(h, Math.max(0, s - 30), Math.min(100, l + 30)),
    200: hslToHex(h, Math.max(0, s - 20), Math.min(100, l + 20)),
    300: hslToHex(h, Math.max(0, s - 10), Math.min(100, l + 10)),
    400: hslToHex(h, Math.max(0, s - 5), Math.min(100, l + 5)),
    500: hslToHex(h, s, l),
    600: hslToHex(h, Math.min(100, s + 5), Math.max(0, l - 5)),
    700: hslToHex(h, Math.min(100, s + 10), Math.max(0, l - 10)),
    800: hslToHex(h, Math.min(100, s + 15), Math.max(0, l - 15)),
    900: hslToHex(h, Math.min(100, s + 20), Math.max(0, l - 20)),
    950: hslToHex(h, Math.min(100, s + 30), Math.max(0, l - 30)),
  }
}

// 主要颜色定义
const primaryColors = {
  light: generateColorPalette('hsl(240 5.9% 10%)'),  // 深蓝色
  dark: generateColorPalette('hsl(0 0% 98%)'),       // 白色
}

// 自定义 PrimeVue 预设
export const CustomLightPreset = definePreset(Aura, {
  semantic: {
    primary: primaryColors.light,
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      }
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '0px'
    }
  }
})

export const CustomDarkPreset = definePreset(Aura, {
  semantic: {
    primary: primaryColors.dark,
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#0f172a',
          100: '#1e293b',
          200: '#334155',
          300: '#475569',
          400: '#64748b',
          500: '#94a3b8',
          600: '#cbd5e1',
          700: '#e2e8f0',
          800: '#f1f5f9',
          900: '#f8fafc',
          950: '#ffffff',
        }
      }
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '0px'
    }
  }
})

// 获取当前主题的预设
export function getCurrentPreset(theme: 'light' | 'dark') {
  return theme === 'light' ? CustomLightPreset : CustomDarkPreset
}