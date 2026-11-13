import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../theme';
import { ICON } from './constants';
import type { TrainingWorkshop } from './data';
import { lh } from './i18n';
import { CalendarCheckIcon } from './icons';
import { styles } from './styles';

interface Props {
  trainings: TrainingWorkshop[];
  onToggleRegistration: (trainingId: string) => void;
}

export function TrainingsTab({ trainings, onToggleRegistration }: Props): React.JSX.Element {
  return (
    <View style={styles.tabContentContainer}>
      <Text style={styles.sectionHeaderTitle}>{lh('trainings.header')}</Text>
      {trainings.map((training) => {
        const isOnline = training.mode === 'Online Webinar';
        return (
          <View key={training.id} style={styles.trainingCard}>
            <View style={styles.trainingTopRow}>
              <View style={[styles.trainingModePill, isOnline && styles.trainingModeOnline]}>
                <Text style={[styles.trainingModeText, isOnline && styles.trainingModeTextOnline]}>
                  {lh(isOnline ? 'trainings.mode.online' : 'trainings.mode.inField')}
                </Text>
              </View>
              <Text style={styles.trainingDate}>{training.date}</Text>
            </View>
            <Text style={styles.trainingTitle}>{training.title}</Text>
            <View style={styles.trainingDetailRow}>
              <CalendarCheckIcon size={ICON.calendar} color={P.twGray500} />
              <Text style={styles.trainingDetailText}>{training.time}</Text>
            </View>
            <Text style={styles.trainingLocationText}>
              {lh('trainings.location', { location: training.location })}
            </Text>
            <Text style={styles.trainingInstructorText}>
              {lh('trainings.instructor', { instructor: training.instructor })}
            </Text>

            <TouchableOpacity
              style={[styles.trainingRegisterBtn, training.isRegistered && styles.trainingRegisteredBtn]}
              onPress={() => onToggleRegistration(training.id)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.trainingRegisterBtnText,
                  training.isRegistered && styles.trainingRegisteredBtnText,
                ]}
              >
                {training.isRegistered ? lh('trainings.registered') : lh('trainings.register')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
