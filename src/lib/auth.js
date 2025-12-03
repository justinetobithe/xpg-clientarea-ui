import { setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../firebase";

export function enableRememberMe(remember) {
    return setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}
