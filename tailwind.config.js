/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			'brand-purple': 'hsl(var(--brand-purple))',
  			'brand-purple-dark': 'hsl(var(--brand-purple-dark))',
  			neon: {
  				DEFAULT: '#3B82F6',
  				hover: '#60A5FA'
  			},
  			background: {
  				DEFAULT: 'hsl(var(--background))',
  				subtle: 'hsl(var(--background-subtle))',
  				muted: 'hsl(var(--background-muted))',
  				'subtle-blue': 'hsl(var(--background-subtle-blue))',
  				dark: {
  					DEFAULT: '#141414',
  					card: '#111827',
  					nav: '#151515'
  				}
  			},
  			'text-primary': 'hsl(var(--text-primary))',
  			'text-secondary': 'hsl(var(--text-secondary))',
  			'text-muted': 'hsl(var(--text-muted))',
  			'text-foreground': 'hsl(var(--foreground))',
  			foreground: 'hsl(var(--foreground))',
  			border: 'hsl(var(--border))',
  			'border-strong': 'hsl(var(--border-strong))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			primary: {
  				DEFAULT: '#3B82F6',
  				foreground: 'hsl(var(--background))',
  				hover: '#60A5FA',
  				dark: {
  					text: '#FFFFFF',
  					bg: '#3B82F6'
  				},
  				opacity: {
  					'5': 'rgba(59, 130, 246, 0.05)',
  					'10': 'rgba(59, 130, 246, 0.1)',
  					'20': 'rgba(59, 130, 246, 0.2)',
  					'40': 'rgba(59, 130, 246, 0.4)',
  					'60': 'rgba(59, 130, 246, 0.6)',
  					'80': 'rgba(59, 130, 246, 0.8)',
  					'90': 'rgba(59, 130, 246, 0.9)'
  				}
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
  				hover: 'rgba(59, 130, 246, 0.1)',
  				dark: {
  					border: '#3B82F6',
  					bg: 'rgba(59, 130, 246, 0.05)'
  				}
  			},
  			destructive: {
  				DEFAULT: '#D97706',
  				foreground: 'hsl(var(--destructive-foreground))',
  				hover: '#B45309',
  				dark: {
  					DEFAULT: '#92400E',
  					hover: '#D97706'
  				}
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: '#3B82F6',
  				foreground: 'hsl(var(--background))',
  				hover: '#60A5FA'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			success: '#22C55E',
  			warning: '#FFB84D',
  			chart: {
  				'1': '#3B82F6',
  				'2': '#60A5FA',
  				'3': '#2563EB',
  				'4': '#93C5FD',
  				'5': '#1D4ED8'
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
  		spacing: {
  			'1': 'var(--spacing-1)',
  			'2': 'var(--spacing-2)',
  			'3': 'var(--spacing-3)',
  			'4': 'var(--spacing-4)',
  			'6': 'var(--spacing-6)',
  			'8': 'var(--spacing-8)',
  			'10': 'var(--spacing-10)',
  			'12': 'var(--spacing-12)',
  			'16': 'var(--spacing-16)',
  			px: 'var(--spacing-px)',
  			'0.5': 'var(--spacing-0-5)'
  		},
  		borderRadius: {
  			sm: 'var(--radius-sm)',
  			md: 'var(--radius-md)',
  			lg: 'var(--radius-lg)',
  			xl: 'var(--radius-xl)',
  			'2xl': 'var(--radius-2xl)',
  			full: 'var(--radius-full)'
  		},
  		boxShadow: {
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			'blue-glow': '0 0 5px rgba(59, 130, 246, 0.3)',
  			'blue-glow-hover': '0 0 8px rgba(96, 165, 250, 0.4)',
  			'blue-glow-strong': '0 0 8px rgba(59, 130, 246, 0.35), 0 0 15px rgba(59, 130, 246, 0.2)'
  		},
  		fontFamily: {
  			sans: [
  				'Inter var',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			xs: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			lg: [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '2rem'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '2.25rem'
  				}
  			]
  		},
  		transitionDuration: {
  			fast: '200ms',
  			normal: 'var(--transition-normal)',
  			slow: 'var(--transition-slow)'
  		},
  		transitionTimingFunction: {
  			default: 'var(--ease-default)'
  		},
  		transitionProperty: {
  			all: 'all'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};