import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { Profile, CreateProfileDTO, UpdateProfileDTO } from '@/types/profile';
import { ApiResponse } from '@/types/api';

/**
 * Profil koleksiyonu referansı
 */
const profilesRef = collection(db, 'profiles');

/**
 * Yeni profil oluşturur
 * @param data - Profil oluşturma verileri
 */
export const createProfile = async (data: CreateProfileDTO): Promise<ApiResponse<Profile>> => {
  try {
    // Yeni doküman referansı al
    const newProfileRef = doc(profilesRef);

    // Profil verisini oluştur
    const profileData: Profile = {
      id: newProfileRef.id,
      ...data,
      email: '',
      avatar: '',
      bio: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Firestore'a kaydet
    await setDoc(newProfileRef, profileData);

    return {
      success: true,
      message: 'Profil başarıyla oluşturuldu',
      data: profileData
    };
  } catch (error) {
    console.error('Profil oluşturma hatası:', error);
    return {
      success: false,
      message: 'Profil oluşturulurken bir hata oluştu',
      error: {
        code: 'PROFILE_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
};

/**
 * Profil bilgilerini getirir
 * @param profileId - Profil ID
 */
export const getProfile = async (profileId: string): Promise<ApiResponse<Profile>> => {
  try {
    const profileDoc = await getDoc(doc(profilesRef, profileId));
    
    if (!profileDoc.exists()) {
      return {
        success: false,
        message: 'Profil bulunamadı',
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Belirtilen ID ile profil bulunamadı'
        }
      };
    }

    const profileData = profileDoc.data() as Profile;

    return {
      success: true,
      message: 'Profil başarıyla getirildi',
      data: profileData
    };
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    return {
      success: false,
      message: 'Profil getirilirken bir hata oluştu',
      error: {
        code: 'PROFILE_GET_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
};

/**
 * Kullanıcının tüm profillerini getirir
 * @param userId - Kullanıcı ID
 */
export const getUserProfiles = async (userId: string): Promise<ApiResponse<Profile[]>> => {
  try {
    const q = query(profilesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const profiles = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Profile));

    return {
      success: true,
      message: 'Profiller başarıyla getirildi',
      data: profiles
    };
  } catch (error) {
    console.error('Profilleri getirme hatası:', error);
    return {
      success: false,
      message: 'Profiller getirilirken bir hata oluştu',
      error: {
        code: 'PROFILES_GET_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
};

/**
 * Profil bilgilerini günceller
 * @param profileId - Profil ID
 * @param data - Güncellenecek veriler
 */
export const updateProfile = async (
  profileId: string, 
  data: UpdateProfileDTO
): Promise<ApiResponse<Profile>> => {
  try {
    const profileRef = doc(profilesRef, profileId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(profileRef, updateData);

    // Güncellenmiş profili getir
    const updatedProfile = await getDoc(profileRef);
    const profileData = {
      ...updatedProfile.data(),
      id: updatedProfile.id
    } as Profile;

    return {
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: profileData
    };
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return {
      success: false,
      message: 'Profil güncellenirken bir hata oluştu',
      error: {
        code: 'PROFILE_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
};

/**
 * Profili siler
 * @param profileId - Profil ID
 */
export const deleteProfile = async (profileId: string): Promise<ApiResponse<void>> => {
  try {
    await deleteDoc(doc(profilesRef, profileId));

    return {
      success: true,
      message: 'Profil başarıyla silindi'
    };
  } catch (error) {
    console.error('Profil silme hatası:', error);
    return {
      success: false,
      message: 'Profil silinirken bir hata oluştu',
      error: {
        code: 'PROFILE_DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
}; 