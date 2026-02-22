import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MapPin, Building2, Send, MessageSquare, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { SocialLinks } from "@/components/SocialLinks";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be under 255 characters"),
  company: z.string().trim().max(100, "Company name must be under 100 characters").optional().or(z.literal("")),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be under 2000 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const subjects = [
  "General Inquiry",
  "Enterprise Partnership",
  "Technical Support",
  "Integration Help",
  "Volume Pricing",
  "Press / Media",
];

export default function Contact() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (_data: ContactForm) => {
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    toast.success(t("contact.sent"));
    reset();
  };

  const infoCards = [
    { icon: Mail, title: t("contact.emailTitle"), detail: t("contact.emailDetail"), sub: t("contact.emailSub") },
    { icon: MessageSquare, title: t("contact.supportTitle"), detail: t("contact.supportDetail"), sub: t("contact.supportSub") },
    { icon: MapPin, title: t("contact.officeTitle"), detail: t("contact.officeDetail"), sub: t("contact.officeSub") },
    { icon: Building2, title: t("contact.legalTitle"), detail: t("contact.legalDetail"), sub: t("contact.legalSub") },
    { icon: Clock, title: t("contact.responseTitle"), detail: t("contact.responseDetail"), sub: t("contact.responseSub") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="page:contact">
      <SEOHead
        title="Contact"
        description="Get in touch with Cryptoniumpay for enterprise partnerships, technical support, or general inquiries. We respond within 24 hours."
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <CryptoniumpayLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
            <Link to="/docs/api" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.docs")}</Link>
            <Link to="/contact" className="text-primary font-medium">{t("nav.contact")}</Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-gold text-primary-foreground">{t("nav.getStarted")}</Button></Link>
          </nav>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-6 bg-foreground transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-6 bg-foreground transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 bg-foreground transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl p-4 space-y-3">
            <Link to="/pricing" className="block text-muted-foreground">{t("nav.pricing")}</Link>
            <Link to="/docs/api" className="block text-muted-foreground">{t("nav.docs")}</Link>
            <Link to="/contact" className="block text-primary font-medium">{t("nav.contact")}</Link>
            <div className="flex gap-2 pt-2">
              <Link to="/login"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
              <Link to="/signup"><Button size="sm" className="bg-gradient-gold text-primary-foreground">{t("nav.getStarted")}</Button></Link>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <motion.section
          initial="hidden" animate="visible" variants={stagger}
          className="container mx-auto px-4 py-20 text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">{t("contact.badge")}</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold font-display mb-4">
            {t("contact.heading")} <span className="text-gradient-gold">{t("contact.headingAccent")}</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </motion.p>
        </motion.section>

        {/* Info Cards + Form */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left — Info */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="lg:col-span-2 space-y-4"
            >
              {infoCards.map(({ icon: Icon, title, detail, sub }) => (
                <motion.div key={title} variants={fadeUp}>
                  <Card>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="rounded-lg bg-primary/10 p-2.5 mt-0.5">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold font-display">{title}</p>
                        <p className="text-sm">{detail}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="lg:col-span-3"
            >
              <Card className="border-primary/20">
                <CardContent className="p-6 md:p-8">
                  {submitted ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-2">
                        <Send className="h-7 w-7 text-success" />
                      </div>
                      <h3 className="text-xl font-bold font-display">{t("contact.sent")}</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        {t("contact.sentDesc")}
                      </p>
                      <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-4">
                        {t("contact.sendAnother")}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <h2 className="text-xl font-bold font-display mb-1">{t("contact.sendMessage")}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t("contact.requiredFields")}</p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t("contact.name")} *</Label>
                          <Input id="name" placeholder={t("contact.name")} {...register("name")} />
                          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t("auth.email")} *</Label>
                          <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
                          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">{t("contact.company")}</Label>
                          <Input id="company" placeholder={t("contact.company")} {...register("company")} />
                          {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>{t("contact.subject")} *</Label>
                          <Select onValueChange={(v) => setValue("subject", v, { shouldValidate: true })}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("contact.selectTopic")} />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{t("contact.message")} *</Label>
                        <Textarea
                          id="message"
                          placeholder={t("contact.messagePlaceholder")}
                          rows={5}
                          {...register("message")}
                        />
                        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-gold text-primary-foreground gap-2"
                      >
                        {isSubmitting ? t("contact.sending") : t("contact.sendBtn")}
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground">{t("nav.home")}</Link>
            <Link to="/pricing" className="hover:text-foreground">{t("nav.pricing")}</Link>
            <Link to="/terms" className="hover:text-foreground">{t("nav.terms")}</Link>
            <Link to="/privacy" className="hover:text-foreground">{t("nav.privacy")}</Link>
          </div>
          <SocialLinks />
          <p>© {new Date().getFullYear()} Cryptoniumpay</p>
        </div>
      </footer>
    </div>
  );
}
