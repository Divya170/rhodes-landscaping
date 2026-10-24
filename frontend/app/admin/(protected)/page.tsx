import { redirect } from 'next/navigation';

/** The admin opens on the estimate requests (leads) list. */
export default function AdminHome() {
  redirect('/admin/leads');
}
