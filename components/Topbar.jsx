import Link from 'next/link';
import styles from './Topbar.module.css';

// Общий хедер. brand — опциональный заголовок слева; links — массив навигации справа; uid — профиль.
export default function Topbar({ brand, links, uid }) {
  return (
    <header className={styles.topbar}>
      {brand ? <div className={styles.brand}>{brand}</div> : null}
      <nav className={styles.right}>
        {links.map((l) => (
          <Link key={l.href} className={styles.navLink} href={l.href}>{l.label}</Link>
        ))}
        <div className={styles.badge}>Профиль: <span className={styles.badgeId}>{uid}</span></div>
      </nav>
    </header>
  );
}
