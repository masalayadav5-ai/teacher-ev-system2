package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.dto.DayDTO;
import com.college.academic.evaluationsystem.dto.SessionPlanRequestDTO;
import com.college.academic.evaluationsystem.model.SessionDay;
import com.college.academic.evaluationsystem.model.SessionPlan;
import com.college.academic.evaluationsystem.repository.SessionPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SessionPlanService {

    @Autowired
    private SessionPlanRepository repository;

  // SessionPlanService.java - update the save method
public SessionPlan save(SessionPlanRequestDTO dto) {
    SessionPlan plan = new SessionPlan();
    plan.setFaculty(dto.getFaculty());
    plan.setCourse(dto.getCourse());
    plan.setSemester(dto.getSemester());

    List<SessionDay> dayList = new ArrayList<>();

    for (DayDTO d : dto.getDays()) {
        SessionDay day = new SessionDay();
        day.setDayNumber(d.getDay_number());  // Use getDay_number()
        day.setTopic(d.getTopic());
        day.setDescription(d.getDescription());
        day.setMethod(d.getMethod());
        day.setSessionPlan(plan);
        dayList.add(day);
    }

    plan.setDays(dayList);
    return repository.save(plan);
}


    public List<SessionPlan> findAll() {
        return repository.findAll();
    }

    public SessionPlan findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session Plan not found"));
    }
}
