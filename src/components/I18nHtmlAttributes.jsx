import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Syncs <html lang> and a class for Amharic (Ethiopic) font stack.
 */
export default function I18nHtmlAttributes() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = i18n.resolvedLanguage || i18n.language;
    const short = lng?.split("-")[0] || "en";
    document.documentElement.lang = short === "am" ? "am" : "en";
    document.documentElement.classList.toggle("font-ethiopic", short === "am");
  }, [i18n.language, i18n.resolvedLanguage]);

  return null;
}
