import { supportedLanguages, useLanguage } from "@/lib/i18n";

export default function LanguageSelector({ className }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={className ?? "inline-flex items-center gap-2 text-sm text-slate-500"}>
      <span className="sr-only">{t("language.selectLabel")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:border-slate-500 focus:outline-none"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
