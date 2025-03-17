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
  				DEFAULT: '#5EEAD4',
  				hover: '#7FFFD4'
  			},
  			background: 'hsl(var(--background))',
  			'background-subtle': 'hsl(var(--background-subtle))',
  			'background-muted': 'hsl(var(--background-muted))',
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
  				DEFAULT: '#5EEAD4',
  				foreground: 'hsl(var(--background))',
  				hover: '#7FFFD4',
  				dark: {
  					text: '#0E0E0E',
  					bg: '#5EEAD4'
  				}
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
  				hover: 'rgba(94, 234, 212, 0.1)',
  				dark: {
  					border: '#5EEAD4',
  					bg: 'rgba(94, 234, 212, 0.05)'
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
  				DEFAULT: '#5EEAD4',
  				foreground: 'hsl(var(--background))',
  				hover: '#7FFFD4'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			success: '#5EEAD4',
  			warning: '#FFB84D',
  			chart: {
  				'1': '#5EEAD4',
  				'2': '#7FFFD4',
  				'3': '#4FD1C5',
  				'4': '#38B2AC',
  				'5': '#319795'
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
  			neon: '0 0 10px rgba(94, 234, 212, 0.6)',
  			'neon-hover': '0 0 20px rgba(127, 255, 212, 0.8)',
  			'neon-strong': '0 0 15px rgba(94, 234, 212, 0.7), 0 0 30px rgba(94, 234, 212, 0.4)'
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
  			fast: 'var(--transition-fast)',
  			normal: 'var(--transition-normal)',
  			slow: 'var(--transition-slow)'
  		},
  		transitionTimingFunction: {
  			default: 'var(--ease-default)'
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