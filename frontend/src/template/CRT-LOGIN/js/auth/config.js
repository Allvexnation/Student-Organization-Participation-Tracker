export const USE_MOCK = true; // mock

export const API = {
  lookupRole: "",
  login: "",
  sendReset: "",
  verifyCode: "",
  resetPassword: "",
};

export const PAGES = {
  login: "login.html",
  forgot: "forgot-password.html",
};

export const ROLES = {
  administrator: {
    label: "Administrator",
    redirect: "",
    summary:
      "Administrator portal: set up students, advisers, organizations and events.",
  },
  adviser: {
    label: "Adviser",
    redirect: "",
    summary:
      "Adviser portal: run organizations, assign tasks and record attendance.",
  },
  student: {
    label: "Student",
    redirect: "",
    summary:
      "Student portal: join events, complete tasks and track your attendance.",
  },
};

export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 60;
export const MIN_PASSWORD = 8;

export const MOCK = {
  latency: 900,
  password: "Crt@12345",
  code: "123456",
  accounts: {
    admin: "administrator",
    adviser: "adviser",
    student: "student",
  },
};
