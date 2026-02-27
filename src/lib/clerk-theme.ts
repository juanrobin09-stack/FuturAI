/**
 * Shared Clerk dark theme appearance config.
 * Uses `variables` (CSS custom properties) for reliable dark mode
 * + `elements` for fine-tuning specific components.
 */
export const clerkDarkTheme = {
  variables: {
    // Core colors
    colorBackground: "#0f1521",          // matches our dark bg
    colorInputBackground: "#1a2332",     // slightly lighter for inputs
    colorText: "#f1f5f9",                // slate-100
    colorTextSecondary: "#94a3b8",       // slate-400
    colorTextOnPrimaryBackground: "#ffffff",
    colorInputText: "#f1f5f9",

    // Primary accent — teal
    colorPrimary: "#14b8a6",             // primary-500 (teal)

    // Danger
    colorDanger: "#f87171",              // red-400

    // Borders & surfaces
    colorNeutral: "#334155",             // slate-700 — used for borders
    colorAlphaShade: "rgba(255,255,255,0.05)", // hover states

    // Shape
    borderRadius: "0.75rem",             // rounded-xl
    fontFamily: "inherit",
  },
  elements: {
    // Card container
    card: "!bg-[#0f1521] !border !border-white/10 !shadow-2xl !shadow-black/50 !rounded-2xl",
    cardBox: "!shadow-none",

    // Header
    headerTitle: "!text-white !font-bold",
    headerSubtitle: "!text-slate-400",

    // Social buttons (Google, GitHub, etc.)
    socialButtonsBlockButton:
      "!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 !rounded-xl !transition-all",
    socialButtonsBlockButtonText: "!font-medium",

    // Divider
    dividerLine: "!bg-white/10",
    dividerText: "!text-slate-500",

    // Form fields
    formFieldLabel: "!text-slate-300",
    formFieldInput:
      "!bg-white/5 !border-white/10 !text-white !rounded-xl focus:!border-primary-500/50 focus:!ring-1 focus:!ring-primary-500/30",
    formFieldHintText: "!text-slate-500",
    formFieldErrorText: "!text-red-400",
    formFieldAction: "!text-primary-400 hover:!text-primary-300",
    formFieldInputShowPasswordButton: "!text-slate-400 hover:!text-white",

    // Primary button
    formButtonPrimary:
      "!bg-gradient-to-r !from-primary-500 !to-primary-600 hover:!from-primary-400 hover:!to-primary-500 !rounded-xl !font-semibold !shadow-lg !shadow-primary-500/25 !transition-all !border-0",
    formButtonReset: "!text-primary-400 hover:!text-primary-300",

    // Footer
    footer: "!bg-transparent",
    footerAction: "!text-slate-400",
    footerActionText: "!text-slate-400",
    footerActionLink: "!text-primary-400 hover:!text-primary-300 !font-medium",

    // Identity preview (email shown after first step)
    identityPreview: "!bg-white/5 !border-white/10 !rounded-xl",
    identityPreviewText: "!text-slate-300",
    identityPreviewEditButton: "!text-primary-400 hover:!text-primary-300",

    // Alert
    alert: "!bg-red-500/10 !border-red-500/20",
    alertText: "!text-red-300",

    // OTP / verification
    otpCodeFieldInput: "!bg-white/5 !border-white/10 !text-white !rounded-lg",

    // Internal elements
    formResendCodeLink: "!text-primary-400",
    selectButton: "!bg-white/5 !border-white/10 !text-white",
    selectOptionsContainer: "!bg-[#0f1521] !border-white/10",
    selectOption: "!text-slate-300 hover:!bg-white/5",
    badge: "!bg-primary-500/10 !text-primary-400",
    avatarBox: "!rounded-lg",

    // Menu / user button
    userButtonPopoverCard: "!bg-[#0f1521] !border-white/10",
    userButtonPopoverActionButton: "!text-slate-300 hover:!bg-white/5",
    userButtonPopoverActionButtonText: "!text-slate-300",
    userButtonPopoverFooter: "!border-white/10",
  },
};
