import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Locale } from "./types";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.pricing": "Pricing",
    "nav.blog": "Blog",
    "nav.docs": "API Docs",
    "nav.security": "Security",
    "nav.contact": "Contact",
    "nav.signin": "Sign in",
    "nav.getStarted": "Get Started Free",
    "hero.title1": "Accept Crypto.",
    "hero.title2": "Pay Less.",
    "hero.subtitle": "The lowest-fee crypto payment gateway. Sign up, get your API key, and start receiving BTC, ETH, and stablecoin payments in minutes. No company verification. No monthly fees.",
    "hero.cta": "Create Free Account",
    "hero.docs": "View API Docs",
    "pricing.fee": "Flat fee per transaction",
    "pricing.monthly": "Monthly fee",
    "pricing.docs": "Documents required",
    "faq.title": "Frequently Asked Questions",
    "faq.subtitle": "Everything you need to know about Cryptoniumpay",
    "faq.search": "Search questions...",
    "faq.all": "All",
    "faq.noResults": "No questions match your search.",
    "invoices.title": "Invoices",
    "invoices.create": "Create Invoice",
    "invoices.empty": "No invoices yet. Create your first invoice to send payment requests.",
    "common.loading": "Loading…",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.send": "Send",
    "common.download": "Download",
    "common.search": "Search...",
  },
  es: {
    "nav.pricing": "Precios",
    "nav.blog": "Blog",
    "nav.docs": "Documentación API",
    "nav.security": "Seguridad",
    "nav.contact": "Contacto",
    "nav.signin": "Iniciar sesión",
    "nav.getStarted": "Comenzar Gratis",
    "hero.title1": "Acepta Cripto.",
    "hero.title2": "Paga Menos.",
    "hero.subtitle": "La pasarela de pago cripto con las tarifas más bajas. Regístrate, obtén tu clave API y comienza a recibir pagos en minutos.",
    "hero.cta": "Crear Cuenta Gratis",
    "hero.docs": "Ver Documentación",
    "faq.title": "Preguntas Frecuentes",
    "faq.subtitle": "Todo lo que necesitas saber sobre Cryptoniumpay",
    "faq.search": "Buscar preguntas...",
    "faq.all": "Todos",
    "faq.noResults": "Ninguna pregunta coincide con tu búsqueda.",
    "invoices.title": "Facturas",
    "invoices.create": "Crear Factura",
    "invoices.empty": "Sin facturas aún. Crea tu primera factura para enviar solicitudes de pago.",
    "common.loading": "Cargando…",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.send": "Enviar",
    "common.download": "Descargar",
    "common.search": "Buscar...",
  },
  fr: {
    "nav.pricing": "Tarifs",
    "nav.blog": "Blog",
    "nav.docs": "Documentation API",
    "nav.security": "Sécurité",
    "nav.contact": "Contact",
    "nav.signin": "Connexion",
    "nav.getStarted": "Commencer Gratuitement",
    "hero.title1": "Acceptez la Crypto.",
    "hero.title2": "Payez Moins.",
    "hero.subtitle": "La passerelle de paiement crypto aux frais les plus bas. Inscrivez-vous et commencez à recevoir des paiements en minutes.",
    "faq.title": "Questions Fréquentes",
    "faq.subtitle": "Tout ce que vous devez savoir sur Cryptoniumpay",
    "faq.search": "Rechercher...",
    "faq.all": "Tous",
    "invoices.title": "Factures",
    "invoices.create": "Créer une Facture",
    "common.loading": "Chargement…",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
  },
  de: { "nav.pricing": "Preise", "nav.blog": "Blog", "nav.signin": "Anmelden", "nav.getStarted": "Kostenlos starten", "faq.title": "Häufig gestellte Fragen", "common.loading": "Laden…" },
  ja: { "nav.pricing": "料金", "nav.blog": "ブログ", "nav.signin": "ログイン", "nav.getStarted": "無料で始める", "faq.title": "よくある質問", "common.loading": "読み込み中…" },
  zh: { "nav.pricing": "价格", "nav.blog": "博客", "nav.signin": "登录", "nav.getStarted": "免费开始", "faq.title": "常见问题", "common.loading": "加载中…" },
  ko: { "nav.pricing": "가격", "nav.blog": "블로그", "nav.signin": "로그인", "nav.getStarted": "무료로 시작", "faq.title": "자주 묻는 질문", "common.loading": "로딩 중…" },
  pt: { "nav.pricing": "Preços", "nav.blog": "Blog", "nav.signin": "Entrar", "nav.getStarted": "Começar Grátis", "faq.title": "Perguntas Frequentes", "common.loading": "Carregando…" },
  ar: { "nav.pricing": "الأسعار", "nav.blog": "المدونة", "nav.signin": "تسجيل الدخول", "nav.getStarted": "ابدأ مجاناً", "faq.title": "الأسئلة الشائعة", "common.loading": "جار التحميل…" },
  ru: { "nav.pricing": "Цены", "nav.blog": "Блог", "nav.signin": "Войти", "nav.getStarted": "Начать бесплатно", "faq.title": "Часто задаваемые вопросы", "common.loading": "Загрузка…" },
};

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English", es: "Español", fr: "Français", de: "Deutsch",
  ja: "日本語", zh: "中文", ko: "한국어", pt: "Português", ar: "العربية", ru: "Русский",
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  locales: typeof LOCALE_LABELS;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("cp_locale");
    return (saved as Locale) || "en";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("cp_locale", l);
    document.documentElement.lang = l;
    if (l === "ar") document.documentElement.dir = "rtl";
    else document.documentElement.dir = "ltr";
  }, []);

  const t = useCallback((key: string): string => {
    return translations[locale]?.[key] ?? translations.en[key] ?? key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, locales: LOCALE_LABELS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
