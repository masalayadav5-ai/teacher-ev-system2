package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.model.Setting;
 import com.college.academic.evaluationsystem.model.EvaluationFrequency;
import com.college.academic.evaluationsystem.repository.SettingRepository;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class SettingService {

    private final SettingRepository settingRepository;

    public SettingService(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    /* --------------------------------
       CREATE DEFAULT SETTINGS (ONCE)
    -------------------------------- */
    @PostConstruct
    public void initDefaultSettings() {
        if (settingRepository.count() == 0) {
            Setting setting = new Setting();
            setting.setInstitutionName("Your Institution Name");
            setting.setEstablishedYear(2010);
            setting.setEvaluationFrequency(EvaluationFrequency.WEEKLY);

            settingRepository.save(setting);
        }
    }

    /* --------------------------------
       GET SETTINGS
    -------------------------------- */
    public Setting getSettings() {
        return settingRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("System settings not found"));
    }

    /* --------------------------------
       UPDATE SETTINGS
    -------------------------------- */
    public Setting updateSettings(Setting updated) {
        Setting existing = getSettings();

        existing.setInstitutionName(updated.getInstitutionName());
        existing.setEstablishedYear(updated.getEstablishedYear());
        existing.setEvaluationFrequency(updated.getEvaluationFrequency());

        return settingRepository.save(existing);
    }
}