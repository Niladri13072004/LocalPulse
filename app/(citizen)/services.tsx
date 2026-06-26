import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Switch, Linking, Alert, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import OfflineBanner from '../../components/OfflineBanner';
import { useServiceStore, ServiceProvider } from '../../store/useServiceStore';

const providerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(10, 'Enter a valid phone number (min 10 digits)'),
  type: z.enum(['Plumber', 'Electrician', 'Tutor', 'Mechanic']),
  description: z.string().min(10, 'Provide a short description (min 10 characters)'),
});

type ProviderSchemaType = z.infer<typeof providerSchema>;

export default function CitizenServicesScreen() {
  const { providers, addProvider } = useServiceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);

  const categories = ['All', 'Plumber', 'Electrician', 'Tutor', 'Mechanic'];

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ProviderSchemaType>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: '',
      phone: '',
      type: 'Plumber',
      description: '',
    }
  });

  const onSubmit = (data: ProviderSchemaType) => {
    addProvider(data);
    setModalVisible(false);
    reset();
    Alert.alert(
      'Submission Received',
      'Thank you! The service provider has been registered and is marked as unverified. Our team will verify credentials shortly.'
    );
  };

  const filteredProviders = providers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <ScreenWrapper>
      <AppHeader />
      <OfflineBanner />

      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.providerName}>{item.name}</Text>
                <Text style={styles.providerType}>{item.type.toUpperCase()}</Text>
              </View>
              
              <View style={styles.verifiedRow}>
                {item.status === 'verified' ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ VERIFIED</Text>
                  </View>
                ) : (
                  <View style={styles.unverifiedBadge}>
                    <Text style={styles.unverifiedText}>UNVERIFIED</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.ratingText}>⭐️ {item.rating > 0 ? `${item.rating.toFixed(1)} / 5` : 'New'}</Text>
              
              <TouchableOpacity 
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
                style={styles.callBtn}
              >
                <Text style={styles.callBtnText}>📞 Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.searchSection}>
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={styles.pageTitle}>Local Service Directory</Text>
                <Text style={styles.pageSubtitle}>Find verified plumbers, tutors and mechanics nearby</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                style={styles.addBtn}
              >
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search services, skills, or names..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.catFilterRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setFilterType(cat)}
                  style={[
                    styles.catTab,
                    filterType === cat && styles.catTabActive
                  ]}
                >
                  <Text style={[styles.catTabText, filterType === cat && styles.catTabTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No service providers found.</Text>
          </View>
        }
      />

      {/* Crowdsource Submission Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register Service Provider</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                {/* Category Type */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Service Type</Text>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.typeRow}>
                        {['Plumber', 'Electrician', 'Tutor', 'Mechanic'].map((t) => (
                          <TouchableOpacity
                            key={t}
                            onPress={() => onChange(t)}
                            style={[styles.typeBtn, value === t && styles.typeBtnActive]}
                          >
                            <Text style={[styles.typeBtnText, value === t && styles.typeBtnTextActive]}>
                              {t}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                </View>

                {/* Name */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Provider Name</Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        placeholder="e.g. Ramesh Prasad"
                        placeholderTextColor="#64748B"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                </View>

                {/* Phone */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Contact Phone</Text>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, errors.phone && styles.inputError]}
                        placeholder="e.g. +91 9988776655"
                        placeholderTextColor="#64748B"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="phone-pad"
                      />
                    )}
                  />
                  {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
                </View>

                {/* Description */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Skills & Description</Text>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                        placeholder="Detail their charges, availability, or specialty skills..."
                        placeholderTextColor="#64748B"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        multiline
                      />
                    )}
                  />
                  {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
                </View>

                <TouchableOpacity 
                  onPress={handleSubmit(onSubmit)}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>Submit Listing</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  searchSection: {
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 14,
    marginBottom: 12,
  },
  catFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catTab: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  catTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  catTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  providerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  providerType: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    backgroundColor: '#10B98120',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  unverifiedBadge: {
    backgroundColor: '#64748B20',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  unverifiedText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  ratingText: {
    color: '#EAB308',
    fontSize: 13,
    fontWeight: '700',
  },
  callBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  callBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    padding: 20,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  typeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
