import { redirect } from "next/navigation";

/** Хуучин холбоос — профайл одоо газрын зураг дээрх цэснээс диалогоор нээгдэнэ. */
export default function ProfileRedirectPage() {
  redirect("/home");
}
