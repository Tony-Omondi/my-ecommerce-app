import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ImageBackground, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Platform 
} from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import api from '../api/api';

const DEFAULT_PROFILE_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjXaep4YWGSofwXSpAbShAlbJk_-PgRKho8W-oLCDOjrmfsQNNDSJPay4ITkp7g29aUPwXX50CFYchjrd9-T52UEj7IB9-iNroHJ7Y09GfDN6SVE0T-BHePmDNPsox6jtKnrIF54vCpSZVFc9N2BnxSt8doU1mzcFpCdPPYk1qBt7-Wq4FGHWRN13n1iSYn6Ah4kDejfwYXzue8eZnKtP0ydVThjYq9Oa6KKkgSKmmJYCL260J7oKR3rGl00QMu4eeysjmBKFFNmL-';

const getGenderDisplayValue = (code) => {
  const genders = {
    'M': 'Male',
    'F': 'Female',
    'O': 'Other'
  };
  return genders[code] || 'Unknown';
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf'),
  });

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    contact_number: '',
    bio: '',
    gender: 'M',
    birthday: '',
    profile_picture: DEFAULT_PROFILE_IMAGE,
    username: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState(new Date());

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/accounts/profile/');
        
        const backendGender = response.data.gender;
        let frontendGender = 'M';
        if (backendGender === 'F') frontendGender = 'F';
        if (backendGender === 'O') frontendGender = 'O';
        
        setProfile({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          contact_number: response.data.contact_number || '',
          bio: response.data.bio || '',
          gender: frontendGender,
          birthday: response.data.birthday || '',
          profile_picture: response.data.profile_picture || DEFAULT_PROFILE_IMAGE,
          username: response.data.user?.username || '@user',
        });

        if (response.data.birthday) {
          const date = moment(response.data.birthday, 'YYYY-MM-DD').toDate();
          if (!isNaN(date.getTime())) {
            setBirthdayDate(date);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Profile Fetch Error:', err);
        setError('Failed to fetch profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!pickerResult.canceled) {
      const selectedImage = pickerResult.assets[0].uri;
      setProfile({ ...profile, profile_picture: selectedImage });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthdayDate(selectedDate);
      setProfile({
        ...profile,
        birthday: moment(selectedDate).format('YYYY-MM-DD')
      });
    }
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('first_name', profile.first_name);
      formData.append('last_name', profile.last_name);
      formData.append('contact_number', profile.contact_number);
      formData.append('bio', profile.bio);
      formData.append('gender', profile.gender);
      formData.append('birthday', profile.birthday);

      if (profile.profile_picture.startsWith('file://')) {
        const localUri = profile.profile_picture;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('profile_picture', {
          uri: localUri,
          name: filename,
          type,
        } as any);
      }

      const response = await api.put('/accounts/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        setProfile({
          ...profile,
          profile_picture: response.data.profile_picture || DEFAULT_PROFILE_IMAGE
        });
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      console.error('Profile Update Error:', err.response?.data);
      
      if (err.response?.data) {
        let errorMessage = 'Please fix the following errors:';
        Object.entries(err.response.data).forEach(([field, errors]) => {
          errorMessage += `\n• ${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
        });
        setError(errorMessage);
      } else {
        setError(err.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#607afb" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0d0f1c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={handleImagePicker}>
              <ImageBackground
                source={{ uri: profile.profile_picture }}
                style={styles.profileImage}
              >
                <View style={styles.cameraIcon}>
                  <MaterialIcons name="photo-camera" size={24} color="white" />
                </View>
              </ImageBackground>
            </TouchableOpacity>
            <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
            <Text style={styles.profileUsername}>{profile.username}</Text>
            <Text style={styles.profileGender}>{getGenderDisplayValue(profile.gender)}</Text>
          </View>

          <View style={styles.formContainer}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={profile.first_name}
                onChangeText={(text) => setProfile({ ...profile, first_name: text })}
                placeholder="Enter first name"
                placeholderTextColor="#47569e"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={profile.last_name}
                onChangeText={(text) => setProfile({ ...profile, last_name: text })}
                placeholder="Enter last name"
                placeholderTextColor="#47569e"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={profile.contact_number}
                onChangeText={(text) => setProfile({ ...profile, contact_number: text })}
                placeholder="Enter contact number"
                placeholderTextColor="#47569e"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={profile.bio}
                onChangeText={(text) => setProfile({ ...profile, bio: text })}
                placeholder="Tell us about yourself"
                placeholderTextColor="#47569e"
                multiline
              />
            </View>

            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={[styles.radioOption, profile.gender === 'M' && styles.radioOptionSelected]}
                onPress={() => setProfile({ ...profile, gender: 'M' })}
              >
                <View style={styles.radioCircle}>
                  {profile.gender === 'M' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.radioOption, profile.gender === 'F' && styles.radioOptionSelected]}
                onPress={() => setProfile({ ...profile, gender: 'F' })}
              >
                <View style={styles.radioCircle}>
                  {profile.gender === 'F' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Female</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.radioOption, profile.gender === 'O' && styles.radioOptionSelected]}
                onPress={() => setProfile({ ...profile, gender: 'O' })}
              >
                <View style={styles.radioCircle}>
                  {profile.gender === 'O' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Other</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Birthday</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {profile.birthday ? moment(profile.birthday).format('MMMM D, YYYY') : 'Select your birthday'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthdayDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <TouchableOpacity 
              style={[styles.updateButton, isSubmitting && styles.updateButtonDisabled]}
              onPress={handleUpdateProfile}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#f8f9fc" />
              ) : (
                <Text style={styles.updateButtonText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#47569e" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Cart')}>
            <MaterialCommunityIcons name="cart-outline" size={24} color="#47569e" />
            <Text style={styles.navText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notifications')}>
            <MaterialIcons name="notifications-none" size={24} color="#47569e" />
            <Text style={styles.navText}>Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome name="user" size={20} color="#0d0f1c" />
            <Text style={[styles.navText, { color: '#0d0f1c' }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8f9fc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0f1c',
    textAlign: 'center',
    flex: 1,
    marginRight: 24,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 64,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0d0f1c',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#47569e',
    marginBottom: 4,
  },
  profileGender: {
    fontSize: 16,
    color: '#47569e',
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0d0f1c',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#e6e9f4',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0d0f1c',
    height: 56,
  },
  dateText: {
    fontSize: 16,
    color: '#0d0f1c',
  },
  bioInput: {
    height: 144,
    textAlignVertical: 'top',
  },
  radioGroup: {
    marginVertical: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced2e9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
  },
  radioOptionSelected: {
    borderColor: '#607afb',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ced2e9',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#607afb',
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0d0f1c',
  },
  updateButton: {
    backgroundColor: '#607afb',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  updateButtonDisabled: {
    backgroundColor: '#a0b4ff',
  },
  updateButtonText: {
    color: '#f8f9fc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6e9f4',
    backgroundColor: '#f8f9fc',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#47569e',
    marginTop: 4,
  },
});