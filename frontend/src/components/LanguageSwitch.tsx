import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import './LanguageSwitch.css';

/** 상단 우측 언어 선택 UI (한국어/영어/일본어). */
export default function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label={t.languageGroupLabel}>
      {LANGUAGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`lang-switch__option ${
            language === opt.value ? 'lang-switch__option--active' : ''
          }`}
          onClick={() => setLanguage(opt.value)}
          aria-pressed={language === opt.value}
          title={opt.label}
        >
          <span className="lang-switch__flag" aria-hidden="true">
            {opt.flag}
          </span>
          <span className="lang-switch__label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
