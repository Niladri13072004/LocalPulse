import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import OfflineBanner from '../../components/OfflineBanner';
import { useLocation } from '../../hooks/useLocation';
import { useSyncStore } from '../../store/useSyncStore';
import { useDraftStore } from '../../store/useDraftStore';
import { useIssueStore } from '../../store/useIssueStore';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { runAIClassification, runDuplicateDetection } from '../../services/gemini';

const issueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters to explain details'),
  category: z.enum(['Pothole', 'Water Logging', 'Garbage', 'Electricity', 'Safety', 'Others']),
});

type IssueSchemaType = z.infer<typeof issueSchema>;

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1599740831114-17186f567646?q=80&w=600',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600',
  'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600',
];

export default function CreateIssueScreen() {
  const router = useRouter();
  const { location, wardInfo, loading: locationLoading, errorMsg } = useLocation();
  const { isOnline, addToQueue } = useSyncStore();
  const { saveDraft } = useDraftStore();
  const { addIssue, issues, upvoteIssue } = useIssueStore();
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [duplicateIssue, setDuplicateIssue] = useState<any | null>(null);

  const { control, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm<IssueSchemaType>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Pothole',
    }
  });

  const handleAIAutoFill = async () => {
    const title = getValues('title');
    const description = getValues('description');
    if (!title || !description) {
      Alert.alert('Incomplete Form', 'Please fill out both Title and Description first so the AI can analyze them.');
      return;
    }
    setAiLoading(true);

    // Duplicate Check
    const dupIds = runDuplicateDetection(title, issues);
    if (dupIds.length > 0) {
      const match = issues.find(i => i.id === dupIds[0]);
      if (match) setDuplicateIssue(match);
    }

    // AI Classification
    const result = await runAIClassification(title, description);
    setValue('category', result.category);
    
    Alert.alert(
      '⚡ AI Intelligence Resolved',
      `Category: ${result.category}\nPriority: ${result.priority.toUpperCase()}\nDepartment: ${result.department}\n\nRecommendation: ${result.smartRecommendation}`
    );
    
    setAiLoading(false);
  };

  const handleCaptureImage = () => {
    // Mock image acquisition
    const randomImg = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
    setImages([...images, randomImg]);
  };

  const handleClearImages = () => {
    setImages([]);
  };

  const onSubmit = async (data: IssueSchemaType) => {
    if (!location || !wardInfo) {
      alert('We need your location coordinate to submit a report.');
      return;
    }

    setSubmitting(true);

    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      images,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      wardName: wardInfo.wardName,
      city: wardInfo.city,
      isAnonymous,
    };

    if (isOnline) {
      // Simulate direct creation (which would normally call supabase)
      addIssue({
        title: payload.title,
        description: payload.description,
        category: payload.category as any,
        imageUrls: payload.images.length > 0 ? payload.images : ['https://images.unsplash.com/photo-1599740831114-17186f567646?q=80&w=600'],
        latitude: payload.latitude,
        longitude: payload.longitude,
        wardName: payload.wardName,
        city: payload.city,
        isAnonymous: payload.isAnonymous,
        reporterName: payload.isAnonymous ? 'Anonymous' : 'Aarav Mehta',
        status: 'open',
        priority: 'medium',
        departmentName: 'Municipality',
      });
      alert('Issue reported successfully!');
    } else {
      // Add to offline sync queue
      addToQueue('create_issue', payload);
      alert('Offline Mode: Your issue has been queued and will upload automatically when you reconnect.');
    }

    setSubmitting(false);
    reset();
    setImages([]);
    setIsAnonymous(false);
    router.replace('/(citizen)/home');
  };

  const handleSaveDraft = handleSubmit((data) => {
    if (!location || !wardInfo) {
      alert('Location required to save draft.');
      return;
    }

    saveDraft({
      title: data.title,
      description: data.description,
      category: data.category,
      images,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      wardName: wardInfo.wardName,
      isAnonymous,
    });

    alert('Draft saved successfully!');
    reset();
    setImages([]);
    setIsAnonymous(false);
    router.replace('/(citizen)/home');
  });

  return (
    <ScreenWrapper scrollable>
      <AppHeader />
      <OfflineBanner />

      <View style={styles.container}>
        <Text style={styles.pageTitle}>Report Civic Issue</Text>

        <View style={styles.form}>
          {duplicateIssue && (
            <View style={styles.duplicateAlert}>
              <Text style={styles.dupAlertTitle}>⚠️ Potential Duplicate Report Found</Text>
              <Text style={styles.dupAlertSub}>
                A similar complaint was reported nearby: "{duplicateIssue.title}".
              </Text>
              <View style={styles.dupAlertActions}>
                <TouchableOpacity
                  onPress={() => {
                    upvoteIssue(duplicateIssue.id, 'usr-citizen-123'); // Upvote the duplicate
                    Alert.alert('Joined Complaint', 'Thank you! You have joined this existing complaint. Upvote added.');
                    router.replace('/(citizen)/home');
                  }}
                  style={styles.joinBtn}
                >
                  <Text style={styles.joinBtnText}>Join Existing Complaint</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDuplicateIssue(null)}
                  style={styles.dismissBtn}
                >
                  <Text style={styles.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Category */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Category</Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={styles.dropdownContainer}>
                  {['Pothole', 'Water Logging', 'Garbage', 'Electricity', 'Safety', 'Others'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => onChange(cat)}
                      style={[
                        styles.dropdownItem,
                        value === cat && styles.dropdownItemActive
                      ]}
                    >
                      <Text style={[styles.dropdownItemText, value === cat && styles.dropdownItemTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Title */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Issue Title</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="e.g. Deep pothole causing skids"
                  placeholderTextColor="#64748B"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Description & Details</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                  placeholder="Describe the issue. Mention landmarks and severity so authorities can act quickly."
                  placeholderTextColor="#64748B"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                />
              )}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
          </View>

          {/* AI Auto-fill Trigger */}
          <TouchableOpacity
            style={styles.aiAutoFillBtn}
            onPress={handleAIAutoFill}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.aiAutoFillBtnText}>⚡ AI Auto-Fill & Scan Duplicates</Text>
            )}
          </TouchableOpacity>

          {/* Camera/Images */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Attach Photos</Text>
            <View style={styles.imagePickerRow}>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={handleCaptureImage}>
                <Text style={styles.pickerIcon}>📸</Text>
                <Text style={styles.pickerText}>Take Photo</Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearImages}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {images.length > 0 && (
              <ScrollView horizontal style={styles.imagePreviewScroll} contentContainerStyle={{ gap: 8 }}>
                {images.map((img, index) => (
                  <Image key={index} source={{ uri: img }} style={styles.previewImage} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Location status box */}
          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>📍 Location Tagging</Text>
            {locationLoading ? (
              <ActivityIndicator color="#0284C7" style={{ marginVertical: 8 }} />
            ) : wardInfo ? (
              <View style={styles.locationDetails}>
                <Text style={styles.coordText}>
                  Lat: {location?.coords.latitude.toFixed(4)}, Lng: {location?.coords.longitude.toFixed(4)}
                </Text>
                <Text style={styles.wardTag}>Resolved Ward: {wardInfo.wardName}, {wardInfo.city}</Text>
              </View>
            ) : (
              <Text style={styles.locationError}>{errorMsg || 'Could not acquire location coords.'}</Text>
            )}
          </View>

          {/* Anonymity flag */}
          <View style={styles.switchWrapper}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>Report Anonymously</Text>
              <Text style={styles.switchDesc}>Hide your profile details from the public feed.</Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
              <Text style={styles.draftBtnText}>Save Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isOnline ? 'Submit Report' : 'Queue Offline'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdownItem: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dropdownItemActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  dropdownItemText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    gap: 8,
  },
  pickerIcon: {
    fontSize: 16,
  },
  pickerText: {
    color: '#38BDF8',
    fontWeight: '600',
    fontSize: 13,
  },
  clearBtn: {
    padding: 8,
  },
  clearText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  imagePreviewScroll: {
    marginTop: 8,
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  locationBox: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
  },
  locationTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  locationDetails: {
    marginTop: 6,
  },
  coordText: {
    color: '#64748B',
    fontSize: 11,
  },
  wardTag: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  locationError: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  switchWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  switchDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  draftBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 15,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  aiAutoFillBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAutoFillBtnText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 14,
  },
  duplicateAlert: {
    backgroundColor: '#3F2D06',
    borderWidth: 1,
    borderColor: '#7F5F0D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  dupAlertTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  dupAlertSub: {
    color: '#D97706',
    fontSize: 12,
    marginTop: 4,
  },
  dupAlertActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  joinBtn: {
    backgroundColor: '#FBBF24',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  joinBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 11,
  },
  dismissBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dismissBtnText: {
    color: '#94A3B8',
    fontWeight: '750',
    fontSize: 11,
  },
});
