import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://mongolian-games-default-rtdb.firebaseio.com/"
};
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db = getDatabase(app);