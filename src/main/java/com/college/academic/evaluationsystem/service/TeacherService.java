package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.model.Teacher;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    public Teacher saveTeacher(Teacher teacher) {
        if (teacher.getStatus() == null) {
            teacher.setStatus("Pending");
        }
        return teacherRepository.save(teacher);
    }

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public Teacher getTeacherById(Long id) {
        return teacherRepository.findById(id).orElse(null);
    }

    // ✅ UPDATE TEACHER
    public Teacher updateTeacher(Long id, Teacher data) {
        Teacher t = teacherRepository.findById(id).orElse(null);
        if (t == null) return null;

        t.setFullName(data.getFullName());
        t.setUsername(data.getUsername());
        t.setAddress(data.getAddress());
        t.setContact(data.getContact());
        t.setDepartment(data.getDepartment());
        t.setQualification(data.getQualification());
        t.setExperience(data.getExperience());
        t.setEmail(data.getEmail());

        return teacherRepository.save(t);
    }

    // ✅ DELETE TEACHER
    public void deleteTeacher(Long id) {
        teacherRepository.deleteById(id);
    }

    public long getTotalTeachers() {
        return teacherRepository.count();
    }

    public long getActiveTeachersCount() {
        return teacherRepository.findAll().stream()
                .filter(t -> "Active".equalsIgnoreCase(t.getStatus()))
                .count();
    }

    public long getPendingTeachersCount() {
        return teacherRepository.findAll().stream()
                .filter(t -> "Pending".equalsIgnoreCase(t.getStatus()))
                .count();
    }
}