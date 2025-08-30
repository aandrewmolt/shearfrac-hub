import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Corporate Design System Colors
				corporate: {
					dark: '#1a1a1a',
					charcoal: '#2d2d2d',
					gray: '#4a4a4a',
					silver: '#8c8c8c',
					light: '#e0e0e0'
				},
				accent: {
					gold: '#D4A017',
					'gold-dark': '#b8901f'
				},
				status: {
					success: '#4a7c59',
					danger: '#a8312f',
					warning: '#cc9900',
					info: '#2e5c8a'
				},
				'border-subtle': '#3a3a3a',
				// shadcn/ui colors mapped to corporate theme
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					gold: '#D4A017',
					'gold-dark': '#b8901f'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-corporate': 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)',
				'gradient-gold': 'linear-gradient(45deg, #D4A017, #b8901f)',
				'gradient-monitor': 'linear-gradient(to bottom right, #1a1a1a, #2d2d2d, #4a4a4a)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Segoe UI', 'Arial', 'sans-serif']
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'120': '30rem'
			},
			letterSpacing: {
				wider: '0.5px',
				widest: '1px'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'alert-pulse': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				},
				'pulse-bg': {
					'0%, 100%': {
						background: 'linear-gradient(45deg, rgba(255, 107, 107, 0.2), rgba(212, 160, 23, 0.2))'
					},
					'50%': {
						background: 'linear-gradient(45deg, rgba(255, 107, 107, 0.4), rgba(212, 160, 23, 0.4))'
					}
				},
				'pulse-border': {
					'0%': {
						borderColor: '#D4A017',
						boxShadow: '0 0 8px rgba(212, 160, 23, 0.5)'
					},
					'50%': {
						borderColor: '#ff6b6b',
						boxShadow: '0 0 12px rgba(255, 107, 107, 0.7)'
					},
					'100%': {
						borderColor: '#D4A017',
						boxShadow: '0 0 8px rgba(212, 160, 23, 0.5)'
					}
				},
				blink: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.3' }
				},
				'blink-text': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.6' }
				},
				slideIn: {
					from: {
						transform: 'translateX(100%)',
						opacity: '0'
					},
					to: {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				modalSlideIn: {
					from: {
						opacity: '0',
						transform: 'translateY(-20px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'gradient-shift': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				},
				'pulse-gold': {
					'0%': {
						boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 0 0 0 rgba(212, 160, 23, 0.7)'
					},
					'70%': {
						boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 0 0 10px rgba(212, 160, 23, 0)'
					},
					'100%': {
						boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 0 0 0 rgba(212, 160, 23, 0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'alert-pulse': 'alert-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'pulse-bg': 'pulse-bg 2s infinite',
				'pulse-border': 'pulse-border 2s infinite',
				blink: 'blink 1.5s infinite',
				'blink-text': 'blink-text 1.5s infinite',
				spin: 'spin 1s linear infinite',
				slideIn: 'slideIn 0.3s ease',
				modalSlideIn: 'modalSlideIn 0.3s ease-out',
				'gradient-shift': 'gradient-shift 3s ease infinite',
				'pulse-gold': 'pulse-gold 2s infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;