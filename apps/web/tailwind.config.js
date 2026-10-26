/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF8F5',
          100: '#F5F1EB',
          200: '#EDE5DA',
          300: '#DFD2C0',
          400: '#CEBCA2',
          500: '#B8A384',
          600: '#998365',
          700: '#7B674D',
          800: '#5A4A35',
          900: '#3D3121',
        },
        maroon: {
          50: '#FDF2F4',
          100: '#FBE4E8',
          200: '#F6CCD4',
          300: '#EEA4B3',
          400: '#E2728B',
          500: '#CF4465',
          600: '#B52B4E',
          700: '#881A36', // Primary deep maroon
          800: '#69142A',
          900: '#4E0E1E',
          950: '#340612',
        },
        saffron: {
          50: '#FFF9EB',
          100: '#FEF0C7',
          200: '#FEE28A',
          300: '#FDCD49',
          400: '#FBB31A',
          500: '#E89205', // Rich saffron / marigold
          600: '#C76F02',
          700: '#9E4E04',
          800: '#7E3D0B',
          900: '#68330D',
        },
        peacock: {
          50: '#F0F9F8',
          100: '#D7F1EE',
          200: '#B2E2DE',
          300: '#7ECDC6',
          400: '#4AAFA8',
          500: '#2A8F8A',
          600: '#1B716E',
          700: '#155957',
          800: '#144645',
          900: '#143B3A',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        sans: [
          'Inter',
          'Plus Jakarta Sans',
          'Noto Sans Devanagari',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
