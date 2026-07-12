import Link from 'next/link';
import styles from './Topbar.module.css';

// Общий хедер. brand — опциональный заголовок слева; link — навигация справа; uid — профиль.
export default function Topbar({ brand, link, uid }) {
  return (
    <header className={styles.topbar}>
      {brand ? <div className={styles.brand}>{brand}</div> : null}
      <nav className={styles.right}>
        <Link className={styles.navLink} href={link.href}>{link.label}</Link>
        <div className={styles.badge}>Профиль: <span className={styles.badgeId}>{uid}</span></div>
      </nav>
    </header>
  );
}
