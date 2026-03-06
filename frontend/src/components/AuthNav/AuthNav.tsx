"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import styles from "./AuthNav.module.css";

export function AuthNav() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className={styles.container}>
      <span className={styles.name}>{session.user.name || session.user.email}</span>
      <button className={styles.signOutBtn} onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
