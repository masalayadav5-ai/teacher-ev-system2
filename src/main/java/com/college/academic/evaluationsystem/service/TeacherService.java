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

    public Teacher updateTeacher(Long id, Teacher data) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher == null) return null;

        teacher.setFullName(data.getFullName());
        teacher.setUsername(data.getUsername());
        teacher.setAddress(data.getAddress());
        teacher.setContact(data.getContact());
        teacher.setDepartment(data.getDepartment());
        teacher.setQualification(data.getQualification());
        teacher.setExperience(data.getExperience());
        teacher.setEmail(data.getEmail());

        return teacherRepository.save(teacher);
    }

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