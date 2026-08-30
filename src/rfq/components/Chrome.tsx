/**
 * Application chrome, matched to the live HIGHBASE product.
 *
 * Two shells: the white marketplace navbar a buyer browses under, and the navy dashboard
 * sidebar the account screens sit in. The negotiation feature lives under Purchasing in
 * that sidebar, next to RFQs and Quotations, which is where the live product already
 * files this kind of work.
 */

import type { ReactNode } from 'react'
import { t, type Lang } from '../domain/i18n'
import { BUYER, SELLER } from '../store'

export function Wordmark({ light, tagline }: { light?: boolean; tagline?: boolean }) {
  return (
    <div className={`hb-wordmark${light ? ' hb-wordmark--light' : ''}`}>
      <b>HIGH</b><i>BASE</i>
      {tagline && <span className="hb-wordmark-tag">WHERE YOU GROW</span>}
    </div>
  )
}

function initials(name: string) {
  return name.replace(/[—-].*$/, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <button type="button" className="hb-langbtn" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
      <span aria-hidden="true">🌐</span>{t(lang, 'language')}
    </button>
  )
}

/** Initials come from the canonical account name, so they stay stable across languages. */
function UserChip({ name, sub, initialsFrom }: { name: string; sub: string; initialsFrom: string }) {
  return (
    <div className="hb-userchip">
      <span className="hb-avatar">{initials(initialsFrom)}</span>
      <span className="hb-userchip-text">
        <span className="hb-userchip-name">{name}</span>
        <span className="hb-userchip-sub">{sub}</span>
      </span>
    </div>
  )
}

/** The marketplace shell — white navbar over the near-white product ground. */
export function MarketplaceChrome({ lang, setLang, cartCount, children }: {
  lang: Lang
  setLang: (l: Lang) => void
  cartCount: number
  children: ReactNode
}) {
  return (
    <>
      <header className="hb-navbar">
        <div className="hb-navbar-inner">
          <Wordmark />
          <button type="button" className="hb-navlink">
            <span aria-hidden="true">▦</span>{t(lang, 'navCategories')}<span aria-hidden="true">⌄</span>
          </button>
          <button type="button" className="hb-navlink">
            <span aria-hidden="true">◎</span>{t(lang, 'navBrands')}
          </button>
          <div className="hb-search"><span aria-hidden="true">🔍</span>{t(lang, 'navSearch')}</div>
          <div className="hb-navicons">
            <button type="button" className="hb-iconbtn" aria-label={t(lang, 'navRewards')}>🎁</button>
            <button type="button" className="hb-iconbtn" aria-label={t(lang, 'navCart')}>
              🛒{cartCount > 0 && <span className="hb-dot">{cartCount}</span>}
            </button>
            <button type="button" className="hb-iconbtn" aria-label={t(lang, 'navMessages')}>💬</button>
            <LangToggle lang={lang} setLang={setLang} />
            <UserChip name={BUYER.name[lang]} initialsFrom={BUYER.name.en} sub={t(lang, 'branchLabel')} />
          </div>
        </div>
      </header>
      {children}
    </>
  )
}

export interface NavGroup {
  label: string
  items: { key: string; icon: string; label: string; badge?: number }[]
}

/**
 * The dashboard shell. The sidebar reproduces the live grouping so the prototype lands
 * the feature where a buyer would actually go looking for it — Purchasing → RFQs.
 */
export function DashboardChrome({ lang, setLang, viewer, groups, active, onNavigate, alerts, title, subtitle, breadcrumb, action, children }: {
  lang: Lang
  setLang: (l: Lang) => void
  /** Who is looking. `admin` is HIGHBASE staff — a third party to the trade (§10). */
  viewer: 'buyer' | 'seller' | 'admin'
  groups: NavGroup[]
  active: string
  onNavigate: (key: string) => void
  /** Draft §8 — the bell counts the same unread items the Inbox does; it is not decor. */
  alerts?: number
  title: string
  subtitle?: string
  breadcrumb: string
  action?: ReactNode
  children: ReactNode
}) {
  const who = viewer === 'buyer' ? BUYER.name[lang] : viewer === 'seller' ? SELLER.name[lang] : t(lang, 'adminOrg')
  return (
    <div className="hb-layout">
      <nav className="hb-sidebar" aria-label={title}>
        <div className="hb-sidebar-head"><Wordmark light tagline /></div>
        {groups.map((group) => (
          <div key={group.label}>
            <div className="hb-sidebar-group">{group.label}</div>
            {group.items.map((item) => (
              <button
                key={item.key} type="button" className="hb-navitem"
                aria-current={active === item.key ? 'page' : undefined}
                onClick={() => onNavigate(item.key)}
              >
                <span className="hb-navitem-icon" aria-hidden="true">{item.icon}</span>{item.label}
                {item.badge ? <span className="hb-navitem-badge">{item.badge}</span> : null}
              </button>
            ))}
            <hr />
          </div>
        ))}
      </nav>

      <div className="hb-main">
        <div className="hb-topbar">
          <button type="button" className="hb-burger" aria-label="Toggle navigation">☰</button>
          <div className="hb-topbar-right">
            <LangToggle lang={lang} setLang={setLang} />
            <button type="button" className="hb-iconbtn" aria-label={t(lang, 'navAlerts')} onClick={() => onNavigate('inbox')}>
              🔔{alerts ? <span className="hb-dot">{alerts}</span> : null}
            </button>
            <UserChip
              name={who}
              initialsFrom={viewer === 'buyer' ? BUYER.name.en : viewer === 'seller' ? SELLER.name.en : 'HIGHBASE'}
              sub={viewer === 'buyer' ? t(lang, 'branchLabel') : viewer === 'seller' ? t(lang, 'roleSalesRep') : t(lang, 'roleAdmin')}
            />
          </div>
        </div>

        <div className="hb-pagehead">
          <div className="hb-spread">
            <div>
              <h1 className="hb-h1">{title}</h1>
              {subtitle && <p className="hb-pagesub">{subtitle}</p>}
            </div>
            {action}
          </div>
          <div className="hb-breadcrumb">
            <b>{t(lang, 'navDashboard')}</b><span aria-hidden="true">•</span>{breadcrumb}
          </div>
        </div>

        <div className="hb-content">{children}</div>
      </div>
    </div>
  )
}
