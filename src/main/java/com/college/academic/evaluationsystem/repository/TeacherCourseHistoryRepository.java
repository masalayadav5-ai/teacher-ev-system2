package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.TeacherCourseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeacherCourseHistoryRepository 
        extends JpaRepository<TeacherCourseHistory, Long> {

    List<TeacherCourseHistory> findByTeacherId(Long teacherId);
}