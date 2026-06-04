export default {
  darkMode: "class",

  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      animation: {
        float: "float 5s ease-in-out infinite",
      },

      keyframes: {
        float: {
          "0%": {
            transform: "translateY(0px)",
          },

          "50%": {
            transform: "translateY(-10px)",
          },

          "100%": {
            transform: "translateY(0px)",
          },
        },
      },
    },
  },

  plugins: [],
};