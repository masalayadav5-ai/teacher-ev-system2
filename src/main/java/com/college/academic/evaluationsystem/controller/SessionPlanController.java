package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.dto.SessionPlanRequestDTO;
import com.college.academic.evaluationsystem.model.SessionPlan;
import com.college.academic.evaluationsystem.service.SessionPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/session-plans")
@CrossOrigin
public class SessionPlanController {

    @Autowired
    private SessionPlanService service;

    @PostMapping
    public SessionPlan save(@RequestBody SessionPlanRequestDTO dto) {
        return service.save(dto);
    }

    @GetMapping
    public List<SessionPlan> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public SessionPlan getById(@PathVariable Long id) {
        return service.findById(id);
    }
}
