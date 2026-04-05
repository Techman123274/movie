"use client";

import { UserProfile } from "@clerk/nextjs";

export function AccountAccessSettings() {
  return (
    <section className="surface rounded-[28px] p-2 sm:p-3">
      <UserProfile
        routing="hash"
        appearance={{
          variables: {
            colorPrimary: "#e50914",
            colorBackground: "#0a0a0c",
            colorText: "#f6f1ea",
            colorTextSecondary: "rgba(246, 241, 234, 0.72)",
            colorInputBackground: "#111214",
            colorInputText: "#f6f1ea",
            colorDanger: "#f97373",
            borderRadius: "1rem",
          },
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none",
            card: "bg-transparent shadow-none",
            navbar: "rounded-[22px] border border-white/10 bg-white/5",
            navbarButton:
              "rounded-2xl text-[var(--color-text-muted)] hover:bg-white/8 hover:text-white data-[active=true]:bg-[rgba(229,9,20,0.14)] data-[active=true]:text-white",
            pageScrollBox: "p-3 sm:p-4",
            page: "gap-4",
            headerTitle: "display-font text-3xl text-white",
            headerSubtitle: "text-sm leading-6 text-[var(--color-text-muted)]",
            profileSection: "rounded-[24px] border border-white/10 bg-black/20",
            profileSectionTitle: "text-white",
            profileSectionTitleText: "text-lg text-white",
            profileSectionContent: "text-[var(--color-text-muted)]",
            accordionTriggerButton: "text-white hover:bg-white/6 rounded-2xl",
            formButtonPrimary:
              "theme-button-primary rounded-full border-0 px-5 py-3 text-sm font-semibold shadow-none",
            formButtonReset:
              "theme-button-secondary rounded-full border-white/10 px-5 py-3 text-sm text-white shadow-none",
            formFieldLabel: "text-[var(--color-text-muted)]",
            formFieldInput:
              "min-h-12 rounded-2xl border-white/10 bg-[#111214] text-white placeholder:text-[var(--color-text-muted)]",
            formFieldInputShowPasswordButton:
              "text-[var(--color-text-muted)] hover:text-white",
            formFieldAction:
              "text-[var(--color-brand-strong)] hover:text-white",
            footerActionLink: "text-[var(--color-brand-strong)] hover:text-white",
            identityPreviewText: "text-white",
            identityPreviewEditButton:
              "text-[var(--color-brand-strong)] hover:text-white",
            badge: "border border-white/10 bg-white/5 text-white",
            avatarBox: "ring-1 ring-white/10",
            modalBackdrop: "bg-black/75 backdrop-blur-sm",
            modalContent:
              "border border-white/10 bg-[#0b0b0d] text-white shadow-[0_24px_90px_rgba(0,0,0,0.5)]",
            menuButton: "text-[var(--color-text-muted)] hover:text-white",
            actionCard: "rounded-[22px] border border-white/10 bg-black/20",
            formResendCodeLink: "text-[var(--color-brand-strong)] hover:text-white",
            formHeaderTitle: "text-white",
            formHeaderSubtitle: "text-[var(--color-text-muted)]",
            dividerLine: "bg-white/8",
            dividerText: "text-[var(--color-text-muted)]",
          },
        }}
      />
    </section>
  );
}
