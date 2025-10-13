// Utility functions for consistent styling across the application
import { theme } from './theme'

// Common button styles
export const buttonStyles = {
  primary: `
    bg-blue-600 
    hover:bg-blue-700 
    text-white 
    font-semibold 
    rounded-lg 
    transition-colors 
    duration-200
    focus:outline-none 
    focus:ring-2 
    focus:ring-blue-500 
    focus:ring-offset-2
  `,
  secondary: `
    bg-gray-200 
    hover:bg-gray-300 
    text-gray-800 
    font-semibold 
    rounded-lg 
    transition-colors 
    duration-200
    focus:outline-none 
    focus:ring-2 
    focus:ring-gray-500 
    focus:ring-offset-2
  `,
  accent: `
    bg-orange-500 
    hover:bg-orange-600 
    text-white 
    font-semibold 
    rounded-lg 
    transition-colors 
    duration-200
    focus:outline-none 
    focus:ring-2 
    focus:ring-orange-500 
    focus:ring-offset-2
  `,
  outline: `
    border-2 
    border-blue-600 
    text-blue-600 
    hover:bg-blue-50 
    font-semibold 
    rounded-lg 
    transition-colors 
    duration-200
    focus:outline-none 
    focus:ring-2 
    focus:ring-blue-500 
    focus:ring-offset-2
  `,
  ghost: `
    text-gray-600 
    hover:bg-gray-100 
    font-semibold 
    rounded-lg 
    transition-colors 
    duration-200
    focus:outline-none 
    focus:ring-2 
    focus:ring-gray-500 
    focus:ring-offset-2
  `,
  disabled: `
    bg-gray-300 
    text-gray-500 
    cursor-not-allowed
  `
}

// Common card styles
export const cardStyles = `
  bg-white 
  rounded-xl 
  shadow-md 
  border 
  border-gray-200 
  overflow-hidden
  transition-shadow 
  duration-200 
  hover:shadow-lg
`

// Common input styles
export const inputStyles = `
  w-full 
  px-4 
  py-2 
  border 
  border-gray-300 
  rounded-lg 
  focus:outline-none 
  focus:ring-2 
  focus:ring-blue-500 
  focus:border-transparent
  transition-all 
  duration-200
`

// Common header styles
export const headerStyles = `
  bg-white 
  shadow-sm 
  border-b 
  border-gray-200 
  sticky 
  top-0 
  z-50
`

// Common gradient backgrounds
export const gradientBackgrounds = {
  primary: 'bg-gradient-to-r from-blue-500 to-purple-600',
  secondary: 'bg-gradient-to-r from-gray-100 to-gray-200',
  accent: 'bg-gradient-to-r from-orange-400 to-pink-500',
  success: 'bg-gradient-to-r from-green-400 to-blue-500',
  warning: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  error: 'bg-gradient-to-r from-red-500 to-orange-400'
}

// Common text styles
export const textStyles = {
  heading: 'font-bold text-gray-900',
  subheading: 'font-semibold text-gray-700',
  body: 'text-gray-600',
  caption: 'text-sm text-gray-500',
  link: 'text-blue-600 hover:text-blue-800 transition-colors duration-200',
  error: 'text-red-600',
  success: 'text-green-600',
  warning: 'text-yellow-600'
}

// Common spacing utilities
export const spacing = {
  section: 'py-12 px-4 sm:px-6 lg:px-8',
  container: 'max-w-7xl mx-auto',
  gap: 'gap-6',
  margin: 'mb-8'
}

// Common animation utilities
export const animations = {
  fadeIn: 'animate-fade-in',
  slideIn: 'animate-slide-in',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce'
}

// Common icon styles
export const iconStyles = {
  small: 'h-4 w-4',
  medium: 'h-5 w-5',
  large: 'h-6 w-6',
  xl: 'h-8 w-8',
  xxl: 'h-10 w-10'
}

// Common badge styles
export const badgeStyles = {
  primary: 'bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  secondary: 'bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  success: 'bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  warning: 'bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  error: 'bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  accent: 'bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full'
}

// Common layout styles
export const layoutStyles = {
  main: 'min-h-screen bg-gray-50',
  section: 'py-16',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
}