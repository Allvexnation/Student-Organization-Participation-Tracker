tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#163a63", 700: "#0f2c4c" },
        blue: { DEFAULT: "#2563eb", 50: "#eaf1ff", 700: "#1d4fd0" },
        yellow: { DEFAULT: "#facc15", 50: "#fff3cd" },
        ink: "#0f1b2d",
        body: "#46546a",
        muted: "#7a889c",
        line: "#e3e8f0",
        surface: "#f5f7fb",
        danger: "#b91c1c",
        success: "#0b7a4b",
      },
      fontFamily: {
        sans: [
          "Poppins",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        lift: "0 10px 30px rgba(22, 58, 99, 0.12)",
        "lift-lg": "0 24px 60px rgba(22, 58, 99, 0.18)",
      },
    },
  },
};
