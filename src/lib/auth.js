import app from "../firebase";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

export const auth = getAuth(app);

export async function enableRememberMe(remember) {
    if (remember) {
        await setPersistence(auth, browserLocalPersistence);
    }
}
