module.exports = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_DEMO_STORAGE:
      process.env.DEMO_STORAGE || (process.env.VERCEL ? "browser" : "server"),
  },
};
