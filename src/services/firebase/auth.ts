import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';

/**
 * Kullanıcı kaydı oluşturur
 * @param credentials - Kayıt bilgileri
 */
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    // Firebase'de kullanıcı oluştur
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    // Kullanıcı profilini güncelle
    await updateProfile(userCredential.user, {
      displayName: credentials.displayName
    });

    // Firestore'da kullanıcı dokümanı oluştur
    const userDoc = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDoc, {
      email: credentials.email,
      displayName: credentials.displayName,
      photoURL: null,
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      role: 'user'
    });

    return {
      success: true,
      message: 'Kayıt başarılı',
      user: await getUserData(userCredential.user)
    };
  } catch (error) {
    console.error('Kayıt hatası:', error);
    const firebaseError = error as FirebaseError;
    return {
      success: false,
      message: firebaseError.message || 'Kayıt sırasında bir hata oluştu'
    };
  }
};

/**
 * Kullanıcı girişi yapar
 * @param credentials - Giriş bilgileri
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    // Son giriş zamanını güncelle
    const userDoc = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDoc, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return {
      success: true,
      message: 'Giriş başarılı',
      user: await getUserData(userCredential.user)
    };
  } catch (error) {
    console.error('Giriş hatası:', error);
    const firebaseError = error as FirebaseError;
    return {
      success: false,
      message: firebaseError.message || 'Giriş sırasında bir hata oluştu'
    };
  }
};

/**
 * Kullanıcı çıkışı yapar
 */
export const logout = async (): Promise<AuthResponse> => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: '��ıkış başarılı'
    };
  } catch (error) {
    console.error('Çıkış hatası:', error);
    const firebaseError = error as FirebaseError;
    return {
      success: false,
      message: firebaseError.message || 'Çıkış sırasında bir hata oluştu'
    };
  }
};

/**
 * Şifre sıfırlama e-postası gönderir
 * @param email - Kullanıcı e-postası
 */
export const resetPassword = async (email: string): Promise<AuthResponse> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Şifre sıfırlama e-postası gönderildi'
    };
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    const firebaseError = error as FirebaseError;
    return {
      success: false,
      message: firebaseError.message || 'Şifre sıfırlama sırasında bir hata oluştu'
    };
  }
};

/**
 * Firebase User nesnesinden User verisini oluşturur
 * @param firebaseUser - Firebase User nesnesi
 */
const getUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    emailVerified: firebaseUser.emailVerified,
    createdAt: userData?.createdAt?.toDate() || new Date(),
    updatedAt: userData?.updatedAt?.toDate() || new Date(),
    lastLoginAt: userData?.lastLoginAt?.toDate(),
    isActive: userData?.isActive || true,
    role: userData?.role || 'user'
  };
}; 