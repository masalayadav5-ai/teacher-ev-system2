package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingRepository extends JpaRepository<Setting, Long> {

    // System settings is expected to have only ONE row
}